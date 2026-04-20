/**
 * Local proxy for Anthropic Claude — keeps the API key off the client.
 * Run from repo root: npm run dev:coach-proxy
 *
 * Set ANTHROPIC_API_KEY in .env (see .env.example in project root).
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
dotenv.config({ path: path.join(root, '.env') })
dotenv.config({ path: path.join(root, '.env.local') })

function normalizeApiKey(raw) {
  if (raw == null || typeof raw !== 'string') return ''
  let s = raw.trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  return s
}

const PORT = Number(process.env.COACH_PROXY_PORT) || 8787
const ANTHROPIC_API_KEY = normalizeApiKey(process.env.ANTHROPIC_API_KEY)
const ANTHROPIC_MODEL = (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514').trim()
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION || '2023-06-01'

function formatAnthropicApiError(bodyText, status) {
  try {
    const j = JSON.parse(bodyText)
    const msg = j?.error?.message
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
  } catch {
    /* ignore */
  }
  return (bodyText && bodyText.trim()) || `Anthropic API error: ${status}`
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON body')
  }
}

function sendJson(res, status, obj) {
  const data = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(data)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function streamAnthropic({ system, messages, maxTokens = 1024 }, res) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      stream: true,
      ...(system ? { system } : {}),
      messages,
    }),
  })

  if (!r.ok) {
    const text = await r.text()
    throw new Error(formatAnthropicApiError(text, r.status))
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    ...CORS_HEADERS,
  })

  const reader = r.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') continue
      try {
        const evt = JSON.parse(payload)
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          res.write(evt.delta.text)
        }
      } catch { /* skip unparseable SSE lines */ }
    }
  }

  res.end()
}

async function handleInsights(body, res) {
  const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : ''
  const userContent = typeof body.userContent === 'string' ? body.userContent : ''
  if (!userContent.trim()) {
    return sendJson(res, 400, { error: 'userContent is required' })
  }

  try {
    await streamAnthropic({
      system: systemPrompt.trim() || undefined,
      messages: [{ role: 'user', content: userContent }],
    }, res)
  } catch (err) {
    if (!res.headersSent) {
      return sendJson(res, 502, { error: err.message || 'Proxy request failed' })
    }
    res.end()
  }
}

async function handleChat(body, res) {
  const msgs = Array.isArray(body.messages) ? body.messages : []
  if (msgs.length === 0) {
    return sendJson(res, 400, { error: 'messages array is required' })
  }

  let system
  const anthropicMessages = []
  for (const m of msgs) {
    if (m.role === 'system') {
      system = m.content
    } else {
      anthropicMessages.push({ role: m.role, content: m.content })
    }
  }

  if (anthropicMessages.length === 0) {
    return sendJson(res, 400, { error: 'At least one user message is required' })
  }

  try {
    await streamAnthropic({ system, messages: anthropicMessages }, res)
  } catch (err) {
    if (!res.headersSent) {
      return sendJson(res, 502, { error: err.message || 'Proxy request failed' })
    }
    res.end()
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS' && req.url.startsWith('/api/coach')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }

  const url = req.url.split('?')[0]

  if (req.method !== 'POST' || !url.startsWith('/api/coach/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('Not found')
  }

  if (!ANTHROPIC_API_KEY || !ANTHROPIC_API_KEY.trim()) {
    return sendJson(res, 503, {
      error:
        'ANTHROPIC_API_KEY is not set. Add it to your .env file in the project root (see .env.example).',
    })
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch (e) {
    return sendJson(res, 400, { error: e.message || 'Bad request' })
  }

  if (url === '/api/coach/insights') {
    return handleInsights(body, res)
  }
  if (url === '/api/coach/chat') {
    return handleChat(body, res)
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  return res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`Coach proxy: http://localhost:${PORT} — POST /api/coach/insights, /api/coach/chat`)
  if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is empty — set it in .env (see .env.example).')
  } else if (!ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    console.warn(
      'ANTHROPIC_API_KEY should start with sk-ant- — paste the full key from console.anthropic.com (not a fragment).',
    )
  } else {
    console.log(`Anthropic key loaded (${ANTHROPIC_API_KEY.length} characters).`)
  }
})
