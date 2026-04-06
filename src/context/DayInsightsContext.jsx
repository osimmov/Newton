/**
 * Horizon AI coach insights (day / week / month / year columns). Cached in localStorage
 * with keys like day:YYYY-MM-DD, week:2026-W13.
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useTasks } from './TaskContext'
import { fetchCoachChat, COACH_MODEL, COACH_BASE_URL } from '../utils/ollamaCoach'
import {
  loadHorizonInsights,
  saveHorizonInsights,
  loadInsightSystemPrompts,
  saveInsightSystemPrompts,
} from '../utils/storage'
import DayInsightsModal from '../components/DayInsightsModal'
import { BUCKET_KIND, tasksInBucket } from '../utils/taskBuckets'

export function insightStorageKey(kind, id) {
  return `${kind}:${id}`
}

const GRAIN_LABEL = {
  [BUCKET_KIND.DAY]: 'day',
  [BUCKET_KIND.WEEK]: 'week',
  [BUCKET_KIND.MONTH]: 'month',
  [BUCKET_KIND.YEAR]: 'year',
}

export const DEFAULT_INSIGHT_SYSTEM_PROMPT_BY_KIND = {
  [BUCKET_KIND.DAY]: `You are a friendly productivity coach. The lists describe tasks on ONE day column of the user's board. "Completed" are marked done on that column; "still open" are scheduled there but not done. Compare progress, patterns, and give 2–4 short, actionable tips. Be supportive. Under 200 words.`,
  [BUCKET_KIND.WEEK]: `You are a friendly productivity coach. The lists describe ONE calendar week column (Monday–Sunday) on the user's board. Relate completed vs still-open tasks for that week; give 2–4 short insights. Under 200 words.`,
  [BUCKET_KIND.MONTH]: `You are a friendly productivity coach. The lists describe ONE month column on the user's board. Relate completed vs still-open tasks for that month; give 2–4 short insights. Under 200 words.`,
  [BUCKET_KIND.YEAR]: `You are a friendly productivity coach. The lists describe ONE year column on the user's board. Relate completed vs still-open tasks for that year; give 2–4 short insights. Under 200 words.`,
}

function sortBucketTasks(taskList) {
  return [...taskList].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : 0
    const ob = typeof b.order === 'number' ? b.order : 0
    if (oa !== ob) return oa - ob
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function completedInBucket(tasks, kind, id) {
  return sortBucketTasks(tasksInBucket(tasks, kind, id).filter((t) => t.completed))
}

function incompleteInBucket(tasks, kind, id) {
  return sortBucketTasks(tasksInBucket(tasks, kind, id).filter((t) => !t.completed))
}

function buildSummaryLines(taskList) {
  return taskList
    .map((t) => {
      const desc = (t.description || '').trim()
      if (desc) return `- ${t.title}\n  Note: ${desc}`
      return `- ${t.title}`
    })
    .join('\n')
}

const DayInsightsContext = createContext(null)

export function DayInsightsProvider({ children }) {
  const { tasks } = useTasks()
  const [modal, setModal] = useState({
    open: false,
    kind: BUCKET_KIND.DAY,
    id: null,
    label: '',
  })
  const [responses, setResponses] = useState(() => loadHorizonInsights())
  const [systemPromptOverrides, setSystemPromptOverrides] = useState(() => loadInsightSystemPrompts())
  const [loadingByKey, setLoadingByKey] = useState({})
  const [errors, setErrors] = useState({})
  const requestIdByKeyRef = useRef({})

  useEffect(() => {
    saveHorizonInsights(responses)
  }, [responses])

  useEffect(() => {
    saveInsightSystemPrompts(systemPromptOverrides)
  }, [systemPromptOverrides])

  const resolveSystemPrompt = useCallback(
    (kind) => {
      const custom = systemPromptOverrides[kind]
      if (typeof custom === 'string' && custom.trim() !== '') return custom.trim()
      return (
        DEFAULT_INSIGHT_SYSTEM_PROMPT_BY_KIND[kind] ||
        DEFAULT_INSIGHT_SYSTEM_PROMPT_BY_KIND[BUCKET_KIND.DAY]
      )
    },
    [systemPromptOverrides]
  )

  const saveSystemPromptForKind = useCallback((kind, text) => {
    const def = (
      DEFAULT_INSIGHT_SYSTEM_PROMPT_BY_KIND[kind] ||
      DEFAULT_INSIGHT_SYSTEM_PROMPT_BY_KIND[BUCKET_KIND.DAY]
    ).trim()
    const t = (text ?? '').trim()
    setSystemPromptOverrides((prev) => {
      const next = { ...prev }
      if (!t || t === def) delete next[kind]
      else next[kind] = t
      return next
    })
  }, [])

  const openHorizonInsights = useCallback((kind, id, label) => {
    setModal({ open: true, kind, id, label })
  }, [])

  const openDayInsights = useCallback((dayId, dateLabel) => {
    openHorizonInsights(BUCKET_KIND.DAY, dayId, dateLabel)
  }, [openHorizonInsights])

  const closeDayInsights = useCallback(() => {
    setModal({ open: false, kind: BUCKET_KIND.DAY, id: null, label: '' })
  }, [])

  const generateForBucket = useCallback(
    async (kind, id, label) => {
      const done = completedInBucket(tasks, kind, id)
      if (done.length === 0) return

      const key = insightStorageKey(kind, id)
      const prev = requestIdByKeyRef.current[key] ?? 0
      const myId = prev + 1
      requestIdByKeyRef.current[key] = myId

      setErrors((e) => {
        const next = { ...e }
        delete next[key]
        return next
      })
      setLoadingByKey((m) => ({ ...m, [key]: true }))

      const open = incompleteInBucket(tasks, kind, id)
      const doneSummary = buildSummaryLines(done)
      const openSummary = open.length ? buildSummaryLines(open) : '(none)'

      const grain = GRAIN_LABEL[kind] || 'period'
      const userContent = `Horizon: one ${grain} column (${label}, id ${id}).

Completed tasks on this ${grain} column:
${doneSummary}

Still on this ${grain} column but not marked complete:
${openSummary}

Give concise coaching based on both lists.`

      try {
        const text = await fetchCoachChat({
          systemPrompt: resolveSystemPrompt(kind),
          userContent,
          model: COACH_MODEL,
          baseUrl: COACH_BASE_URL,
        })
        if (requestIdByKeyRef.current[key] !== myId) return
        setResponses((r) => ({ ...r, [key]: text.trim() }))
      } catch (err) {
        if (requestIdByKeyRef.current[key] !== myId) return
        setErrors((e) => ({ ...e, [key]: err.message || 'Failed to get insights' }))
      } finally {
        if (requestIdByKeyRef.current[key] === myId) {
          setLoadingByKey((m) => {
            const next = { ...m }
            delete next[key]
            return next
          })
        }
      }
    },
    [tasks, resolveSystemPrompt]
  )

  const regenerateDay = useCallback(() => {
    const { kind, id, label } = modal
    if (!id) return
    generateForBucket(kind, id, label)
  }, [modal, generateForBucket])

  const { open, kind: modalKind, id: modalId, label } = modal
  const modalKey = modalId ? insightStorageKey(modalKind, modalId) : ''

  useEffect(() => {
    if (!open || !modalId) return
    const done = completedInBucket(tasks, modalKind, modalId)
    if (done.length === 0) return
    if (responses[modalKey]) return
    if (loadingByKey[modalKey]) return
    if (errors[modalKey]) return
    generateForBucket(modalKind, modalId, label)
  }, [
    open,
    modalKind,
    modalId,
    label,
    modalKey,
    tasks,
    responses,
    loadingByKey,
    errors,
    generateForBucket,
  ])

  const value = useMemo(
    () => ({
      openDayInsights,
      openHorizonInsights,
      closeDayInsights,
      insightStorageKey,
      responses,
      loadingByKey,
    }),
    [openDayInsights, openHorizonInsights, closeDayInsights, responses, loadingByKey]
  )

  const entryCount = modalId ? completedInBucket(tasks, modalKind, modalId).length : 0

  return (
    <DayInsightsContext.Provider value={value}>
      {children}
      {modal.open && modalId && (
        <DayInsightsModal
          horizonKind={modalKind}
          dateLabel={label}
          onClose={closeDayInsights}
          response={responses[modalKey]}
          error={errors[modalKey]}
          loading={!!loadingByKey[modalKey]}
          onRegenerate={regenerateDay}
          modelName={COACH_MODEL}
          entryCount={entryCount}
          effectiveSystemPrompt={resolveSystemPrompt(modalKind)}
          defaultSystemPrompt={
            DEFAULT_INSIGHT_SYSTEM_PROMPT_BY_KIND[modalKind] ||
            DEFAULT_INSIGHT_SYSTEM_PROMPT_BY_KIND[BUCKET_KIND.DAY]
          }
          onSaveSystemPrompt={(text) => saveSystemPromptForKind(modalKind, text)}
        />
      )}
    </DayInsightsContext.Provider>
  )
}

export function useDayInsights() {
  const ctx = useContext(DayInsightsContext)
  if (!ctx) throw new Error('useDayInsights must be used within DayInsightsProvider')
  return ctx
}
