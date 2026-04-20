/**
 * Horizon AI coach insights (day / week / month / year columns). Cached in localStorage
 * with keys like day:YYYY-MM-DD, week:2026-W13.
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useTasks } from './TaskContext'
import { fetchHorizonInsights } from '../utils/insightsCoach'
import { getInsightsModelDisplayName } from '../utils/constants'
import {
  loadHorizonInsights,
  saveHorizonInsights,
  loadInsightSystemPrompts,
  saveInsightSystemPrompts,
} from '../utils/storage'
import DayInsightsModal from '../components/DayInsightsModal'
import { BUCKET_KIND, tasksInBucket, isDayScopedTask } from '../utils/taskBuckets'
import { dayIdsInIsoWeek, dayIdsInMonth } from '../utils/calendarHorizon'

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
  [BUCKET_KIND.WEEK]: `You are a friendly productivity coach. The user sees a calendar week (Mon–Sun). One list is tasks completed on **daily columns** within those dates. Another list is the **week column** (tasks parked on that week bucket): completed vs still open. Compare the two when both have items: e.g. work finished on specific days vs broader week-level tasks, balance, overload. If only one side has data, focus there. 2–4 short insights, supportive, under 200 words.`,
  [BUCKET_KIND.MONTH]: `You are a friendly productivity coach. The user sees one calendar month. One list is tasks completed on **daily columns** within that month. Another list is the **month column** (tasks parked on that month bucket): completed vs still open. Compare the two when both have items: e.g. work finished on specific days vs broader month-level goals, pacing, balance. If only one side has data, focus there. 2–4 short insights, supportive, under 200 words.`,
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

function formatDayIdLabel(dayId) {
  const d = new Date(`${dayId}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dayId
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  const rest = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${weekday} ${rest}`
}

/** Day-column completions per day + week-bucket slices for one ISO week. */
function getWeekInsightSlices(tasks, weekId) {
  const dayIds = dayIdsInIsoWeek(weekId)
  const daySet = new Set(dayIds)
  const byDay = new Map()
  for (const d of dayIds) byDay.set(d, [])
  for (const t of tasks) {
    if (isDayScopedTask(t) && t.completed && t.dayId && daySet.has(t.dayId)) {
      byDay.get(t.dayId).push(t)
    }
  }
  for (const d of dayIds) byDay.set(d, sortBucketTasks(byDay.get(d)))

  const weekTasks = tasksInBucket(tasks, BUCKET_KIND.WEEK, weekId)
  return {
    dayIds,
    byDay,
    weekDone: sortBucketTasks(weekTasks.filter((t) => t.completed)),
    weekOpen: sortBucketTasks(weekTasks.filter((t) => !t.completed)),
  }
}

function weekSlicesHasInsightData(s) {
  for (const list of s.byDay.values()) {
    if (list.length > 0) return true
  }
  return s.weekDone.length + s.weekOpen.length > 0
}

function weekSlicesEntryCount(s) {
  let n = s.weekDone.length + s.weekOpen.length
  for (const list of s.byDay.values()) n += list.length
  return n
}

function buildWeekInsightUserContent(slices, weekId, label) {
  const { dayIds, byDay, weekDone, weekOpen } = slices
  const daySections = []
  for (const did of dayIds) {
    const list = byDay.get(did)
    if (!list?.length) continue
    daySections.push(`${formatDayIdLabel(did)} (${did}):`, buildSummaryLines(list))
  }
  const dayPart =
    daySections.length > 0
      ? daySections.join('\n')
      : '(none — no completed tasks on daily columns in this week)'

  const weekDoneSummary = weekDone.length ? buildSummaryLines(weekDone) : '(none)'
  const weekOpenSummary = weekOpen.length ? buildSummaryLines(weekOpen) : '(none)'

  return `Horizon: one calendar week (${label}, week id ${weekId}).

Completed tasks on **daily columns** (Mon–Sun in this week), grouped by day:
${dayPart}

**Week column** (tasks assigned directly to this week bucket):
Completed:
${weekDoneSummary}

Still on week column, not complete:
${weekOpenSummary}

Give concise coaching. When both daily completions and week-column tasks exist, compare them.`
}

/** Day-column completions per day + month-bucket slices for one calendar month. */
function getMonthInsightSlices(tasks, monthId) {
  const dayIds = dayIdsInMonth(monthId)
  const daySet = new Set(dayIds)
  const byDay = new Map()
  for (const d of dayIds) byDay.set(d, [])
  for (const t of tasks) {
    if (isDayScopedTask(t) && t.completed && t.dayId && daySet.has(t.dayId)) {
      byDay.get(t.dayId).push(t)
    }
  }
  for (const d of dayIds) byDay.set(d, sortBucketTasks(byDay.get(d)))

  const monthTasks = tasksInBucket(tasks, BUCKET_KIND.MONTH, monthId)
  return {
    dayIds,
    byDay,
    monthDone: sortBucketTasks(monthTasks.filter((t) => t.completed)),
    monthOpen: sortBucketTasks(monthTasks.filter((t) => !t.completed)),
  }
}

function monthSlicesHasInsightData(s) {
  for (const list of s.byDay.values()) {
    if (list.length > 0) return true
  }
  return s.monthDone.length + s.monthOpen.length > 0
}

function monthSlicesEntryCount(s) {
  let n = s.monthDone.length + s.monthOpen.length
  for (const list of s.byDay.values()) n += list.length
  return n
}

function buildMonthInsightUserContent(slices, monthId, label) {
  const { dayIds, byDay, monthDone, monthOpen } = slices
  const daySections = []
  for (const did of dayIds) {
    const list = byDay.get(did)
    if (!list?.length) continue
    daySections.push(`${formatDayIdLabel(did)} (${did}):`, buildSummaryLines(list))
  }
  const dayPart =
    daySections.length > 0
      ? daySections.join('\n')
      : '(none — no completed tasks on daily columns in this month)'

  const monthDoneSummary = monthDone.length ? buildSummaryLines(monthDone) : '(none)'
  const monthOpenSummary = monthOpen.length ? buildSummaryLines(monthOpen) : '(none)'

  return `Horizon: one calendar month (${label}, month id ${monthId}).

Completed tasks on **daily columns** within this month, grouped by day:
${dayPart}

**Month column** (tasks assigned directly to this month bucket):
Completed:
${monthDoneSummary}

Still on month column, not complete:
${monthOpenSummary}

Give concise coaching. When both daily completions and month-column tasks exist, compare them.`
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
      const key = insightStorageKey(kind, id)

      let userContent = ''
      if (kind === BUCKET_KIND.WEEK) {
        const slices = getWeekInsightSlices(tasks, id)
        if (!weekSlicesHasInsightData(slices)) return
        userContent = buildWeekInsightUserContent(slices, id, label)
      } else if (kind === BUCKET_KIND.MONTH) {
        const slices = getMonthInsightSlices(tasks, id)
        if (!monthSlicesHasInsightData(slices)) return
        userContent = buildMonthInsightUserContent(slices, id, label)
      } else {
        const done = completedInBucket(tasks, kind, id)
        if (done.length === 0) return
        const open = incompleteInBucket(tasks, kind, id)
        const doneSummary = buildSummaryLines(done)
        const openSummary = open.length ? buildSummaryLines(open) : '(none)'
        const grain = GRAIN_LABEL[kind] || 'period'
        userContent = `Horizon: one ${grain} column (${label}, id ${id}).

Completed tasks on this ${grain} column:
${doneSummary}

Still on this ${grain} column but not marked complete:
${openSummary}

Give concise coaching based on both lists.`
      }

      const prev = requestIdByKeyRef.current[key] ?? 0
      const myId = prev + 1
      requestIdByKeyRef.current[key] = myId

      setErrors((e) => {
        const next = { ...e }
        delete next[key]
        return next
      })
      setLoadingByKey((m) => ({ ...m, [key]: true }))

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90_000)

      try {
        const text = await fetchHorizonInsights({
          systemPrompt: resolveSystemPrompt(kind),
          userContent,
          signal: controller.signal,
          onChunk(accumulated) {
            if (requestIdByKeyRef.current[key] !== myId) return
            setResponses((r) => ({ ...r, [key]: accumulated }))
          },
        })
        if (requestIdByKeyRef.current[key] !== myId) return
        setResponses((r) => ({ ...r, [key]: text.trim() }))
      } catch (err) {
        if (requestIdByKeyRef.current[key] !== myId) return
        const msg = err.name === 'AbortError'
          ? 'Request timed out. Is the coach proxy running?'
          : (err.message || 'Failed to get insights')
        setErrors((e) => ({ ...e, [key]: msg }))
      } finally {
        clearTimeout(timeout)
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
    if (modalKind === BUCKET_KIND.WEEK) {
      const slices = getWeekInsightSlices(tasks, modalId)
      if (!weekSlicesHasInsightData(slices)) return
    } else if (modalKind === BUCKET_KIND.MONTH) {
      const slices = getMonthInsightSlices(tasks, modalId)
      if (!monthSlicesHasInsightData(slices)) return
    } else {
      const done = completedInBucket(tasks, modalKind, modalId)
      if (done.length === 0) return
    }
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

  const entryCount = (() => {
    if (!modalId) return 0
    if (modalKind === BUCKET_KIND.WEEK) {
      return weekSlicesEntryCount(getWeekInsightSlices(tasks, modalId))
    }
    if (modalKind === BUCKET_KIND.MONTH) {
      return monthSlicesEntryCount(getMonthInsightSlices(tasks, modalId))
    }
    return completedInBucket(tasks, modalKind, modalId).length
  })()

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
          modelName={getInsightsModelDisplayName()}
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
