/**
 * Reflections state lives here so it survives switching away from the AI Reflections panel.
 * In-flight Ollama requests complete even when the panel is unmounted; results apply when done.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useTasks } from './TaskContext'
import { OLLAMA_BASE_URL, OLLAMA_REFLECTIONS_MODEL } from '../utils/constants'
import { buildRecentChangeLogSummary, fetchCoachChat } from '../utils/ollamaCoach'

const MAX_ENTRIES_FOR_PROMPT = 80

const SYSTEM_PROMPT = `You are a friendly productivity coach. Given a user's activity log (tasks created, completed, edited, deleted, rescheduled), give 2–4 short, specific tips to improve their productivity. Be concise and actionable. Write in a supportive tone. Keep the reply under 200 words.`

const ReflectionsContext = createContext(null)

export function ReflectionsProvider({ children }) {
  const { changeLog } = useTasks()
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  const generate = useCallback(async () => {
    setError(null)
    setLoading(true)
    const myId = ++requestIdRef.current
    const summary = buildRecentChangeLogSummary(changeLog, MAX_ENTRIES_FOR_PROMPT)
    try {
      const text = await fetchCoachChat({
        systemPrompt: SYSTEM_PROMPT,
        userContent: `Activity log:\n\n${summary}`,
        model: OLLAMA_REFLECTIONS_MODEL,
        baseUrl: OLLAMA_BASE_URL,
      })
      if (myId !== requestIdRef.current) return
      setResponse(text.trim())
    } catch (e) {
      if (myId !== requestIdRef.current) return
      setError(e.message || 'Failed to get reflections')
    } finally {
      if (myId === requestIdRef.current) setLoading(false)
    }
  }, [changeLog])

  const value = {
    response,
    loading,
    error,
    generate,
    changeLogLength: changeLog.length,
    modelName: OLLAMA_REFLECTIONS_MODEL,
  }

  return <ReflectionsContext.Provider value={value}>{children}</ReflectionsContext.Provider>
}

export function useReflections() {
  const ctx = useContext(ReflectionsContext)
  if (!ctx) throw new Error('useReflections must be used within ReflectionsProvider')
  return ctx
}
