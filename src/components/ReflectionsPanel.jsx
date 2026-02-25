/**
 * ReflectionsPanel - AI reflections on the user's activity (change log).
 * Uses a local LLM via Ollama (e.g. DeepSeek 7B) to suggest personalized productivity tips.
 * Requires Ollama running locally with the model pulled: ollama pull deepseek-r1:7b
 */

import { useState, useCallback } from 'react'
import { useTasks } from '../context/TaskContext'
import { OLLAMA_BASE_URL, OLLAMA_REFLECTIONS_MODEL, ACTION_LABELS } from '../utils/constants'

const MAX_ENTRIES_FOR_PROMPT = 80

function formatEntryForLog(entry) {
  const d = new Date(entry.timestamp)
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const text = entry.message ?? `${entry.taskName} ${ACTION_LABELS[entry.action] || entry.action}`
  return `- ${dateStr} ${timeStr}: ${text}`
}

function buildLogSummary(changeLog) {
  const slice = changeLog.slice(0, MAX_ENTRIES_FOR_PROMPT)
  if (slice.length === 0) return 'No activity recorded yet.'
  return slice.map(formatEntryForLog).join('\n')
}

const SYSTEM_PROMPT = `You are a friendly productivity coach. Given a user's activity log (tasks created, completed, edited, deleted, rescheduled), give 2–4 short, specific tips to improve their productivity. Be concise and actionable. Write in a supportive tone. Keep the reply under 200 words.`

async function fetchReflections(logSummary, model, baseUrl) {
  const url = `${baseUrl}/api/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Activity log:\n\n${logSummary}` },
      ],
      stream: false,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Ollama error: ${res.status}`)
  }
  const data = await res.json()
  return data.message?.content ?? ''
}

function ReflectionsPanel() {
  const { changeLog } = useTasks()
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = useCallback(async () => {
    setError(null)
    setLoading(true)
    setResponse('')
    const summary = buildLogSummary(changeLog)
    try {
      const text = await fetchReflections(summary, OLLAMA_REFLECTIONS_MODEL, OLLAMA_BASE_URL)
      setResponse(text.trim())
    } catch (e) {
      setError(e.message || 'Failed to get reflections')
    } finally {
      setLoading(false)
    }
  }, [changeLog])

  return (
    <aside className="flex flex-col flex-1 min-w-0 max-w-4xl bg-newton-charcoal">
      <div className="px-4 py-4 border-b border-newton-border">
        <h2 className="text-xl font-semibold text-newton-text">AI Reflections</h2>
        <p className="text-sm text-newton-muted mt-1">
          Personalized tips from your activity. Uses a local model (Ollama).
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="mt-3 px-4 py-2 rounded-lg bg-newton-surface hover:bg-newton-border text-newton-text text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating…' : 'Generate reflections'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-800/50 text-red-200 text-sm p-3 mb-3">
            {error}
            <p className="mt-2 text-newton-muted text-xs">
              Make sure Ollama is running and the model is pulled: <code className="bg-newton-surface px-1 rounded">ollama pull {OLLAMA_REFLECTIONS_MODEL}</code>
            </p>
          </div>
        )}
        {response ? (
          <div className="text-newton-text text-sm whitespace-pre-wrap leading-relaxed">
            {response}
          </div>
        ) : !loading && !error && (
          <p className="text-newton-muted text-sm">
            {changeLog.length === 0
              ? 'Add and complete some tasks, then generate reflections.'
              : 'Click "Generate reflections" to get tips based on your activity.'}
          </p>
        )}
      </div>
    </aside>
  )
}

export default ReflectionsPanel
