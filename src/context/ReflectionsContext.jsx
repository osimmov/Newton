/**
 * AI Reflections chat: multi-turn Q&A grounded in the task activity log (changeLog).
 * State survives switching away from the panel; in-flight requests still apply when done.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useTasks } from './TaskContext'
import {
  OLLAMA_BASE_URL,
  OLLAMA_REFLECTIONS_MODEL,
  INSIGHTS_PROVIDER,
  COACH_CHAT_URL,
  getInsightsModelDisplayName,
} from '../utils/constants'
import { buildRecentChangeLogSummary, fetchCoachChatMessages } from '../utils/ollamaCoach'
import { fetchStreaming } from '../utils/streamingFetch'

const MAX_ENTRIES_FOR_PROMPT = 120

const SYSTEM_PROMPT = `You are a concise productivity coach. The user chats about their work habits.

You will receive messages that include an "Activity log" section on each user turn. That log lists task-related events (created, completed, edited, deleted, rescheduled) with timestamps and task names, newest first.

Rules:
- For factual answers (counts, dates, comparisons between weeks, "most productive day", etc.), use only what appears in the Activity log. Parse timestamps and task names from the log.
- If the user asks about something not represented in the log (e.g. meetings, calendar, email) and it does not appear as task activity, say clearly that you do not see it in their activity log and suggest logging those items as tasks if they want them tracked here.
- Be direct and helpful. Short paragraphs or bullet points are fine. Do not invent events that are not in the log.`

function chatId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const ReflectionsContext = createContext(null)

export function ReflectionsProvider({ children }) {
  const { changeLog } = useTasks()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)
  const busyRef = useRef(false)

  const clearChat = useCallback(() => {
    requestIdRef.current += 1
    busyRef.current = false
    setMessages([])
    setError(null)
    setLoading(false)
  }, [])

  const sendMessage = useCallback(
    async (rawText) => {
      const text = rawText.trim()
      if (!text || busyRef.current) return
      busyRef.current = true

      const myId = ++requestIdRef.current
      setError(null)
      setLoading(true)

      let threadAfterUser
      setMessages((prev) => {
        const userMsg = { id: chatId(), role: 'user', content: text }
        threadAfterUser = [...prev, userMsg]
        return threadAfterUser
      })

      const summary = buildRecentChangeLogSummary(changeLog, MAX_ENTRIES_FOR_PROMPT)
      const logBlock = `---\nActivity log (most recent first, up to ${MAX_ENTRIES_FOR_PROMPT} entries):\n${summary}`

      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...threadAfterUser.map((m, idx) => {
          if (m.role === 'user' && idx === threadAfterUser.length - 1) {
            return { role: 'user', content: `${m.content}\n\n${logBlock}` }
          }
          if (m.role === 'assistant') {
            return { role: 'assistant', content: m.content }
          }
          return { role: 'user', content: m.content }
        }),
      ]

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90_000)

      const assistantId = chatId()

      try {
        if (INSIGHTS_PROVIDER === 'claude') {
          setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

          const full = await fetchStreaming({
            url: COACH_CHAT_URL,
            body: { messages: apiMessages },
            signal: controller.signal,
            onChunk(accumulated) {
              if (myId !== requestIdRef.current) return
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
              )
            },
          })

          if (myId !== requestIdRef.current) return
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: full.trim() } : m))
          )
        } else {
          const reply = await fetchCoachChatMessages({
            messages: apiMessages,
            model: OLLAMA_REFLECTIONS_MODEL,
            baseUrl: OLLAMA_BASE_URL,
          })
          if (myId !== requestIdRef.current) return
          setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: reply.trim() }])
        }
      } catch (e) {
        if (myId !== requestIdRef.current) return
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content))
        const msg = e.name === 'AbortError'
          ? 'Request timed out. Is the coach proxy running?'
          : (e.message || 'Failed to get a reply')
        setError(msg)
      } finally {
        clearTimeout(timeout)
        busyRef.current = false
        if (myId === requestIdRef.current) setLoading(false)
      }
    },
    [changeLog]
  )

  const value = {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    changeLogLength: changeLog.length,
    modelName: getInsightsModelDisplayName(),
    provider: INSIGHTS_PROVIDER,
  }

  return <ReflectionsContext.Provider value={value}>{children}</ReflectionsContext.Provider>
}

export function useReflections() {
  const ctx = useContext(ReflectionsContext)
  if (!ctx) throw new Error('useReflections must be used within ReflectionsProvider')
  return ctx
}
