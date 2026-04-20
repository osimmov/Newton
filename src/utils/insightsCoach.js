/**
 * Horizon insights: Ollama (local) or Claude via same-origin / proxied coach API.
 * When `onChunk` is provided and provider is Claude, streams text incrementally.
 */

import {
  INSIGHTS_PROVIDER,
  COACH_INSIGHTS_URL,
  OLLAMA_BASE_URL,
  OLLAMA_REFLECTIONS_MODEL,
} from './constants'
import { fetchCoachChat } from './ollamaCoach'
import { fetchStreaming } from './streamingFetch'

export async function fetchHorizonInsights({ systemPrompt, userContent, signal, onChunk }) {
  if (INSIGHTS_PROVIDER === 'claude') {
    const full = await fetchStreaming({
      url: COACH_INSIGHTS_URL,
      body: { systemPrompt, userContent },
      signal,
      onChunk: onChunk || (() => {}),
    })
    return full.trim()
  }

  return fetchCoachChat({
    systemPrompt,
    userContent,
    model: OLLAMA_REFLECTIONS_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  })
}
