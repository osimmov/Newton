/**
 * Shared Ollama chat helper and change-log formatting for productivity-coach prompts.
 */

import { OLLAMA_BASE_URL, OLLAMA_REFLECTIONS_MODEL, ACTION_LABELS } from './constants'

export function formatChangeLogEntryLine(entry) {
  const d = new Date(entry.timestamp)
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const text = entry.message ?? `${entry.taskName} ${ACTION_LABELS[entry.action] || entry.action}`
  return `- ${dateStr} ${timeStr}: ${text}`
}

export function buildRecentChangeLogSummary(changeLog, maxEntries = 80) {
  const slice = changeLog.slice(0, maxEntries)
  if (slice.length === 0) return 'No activity recorded yet.'
  return slice.map(formatChangeLogEntryLine).join('\n')
}

export async function fetchCoachChat({ systemPrompt, userContent, model, baseUrl }) {
  const url = `${baseUrl}/api/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
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

export const COACH_MODEL = OLLAMA_REFLECTIONS_MODEL
export const COACH_BASE_URL = OLLAMA_BASE_URL
