/**
 * LocalStorage persistence layer
 * Abstracts storage - can be replaced with API calls for backend migration
 */

import { STORAGE_KEYS } from './constants'

export function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
}

export function loadChangeLog() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHANGE_LOG)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveChangeLog(entries) {
  localStorage.setItem(STORAGE_KEYS.CHANGE_LOG, JSON.stringify(entries))
}

export function loadUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER)
    return data || 'saidamir osimov'
  } catch {
    return 'saidamir osimov'
  }
}

export function saveUser(name) {
  localStorage.setItem(STORAGE_KEYS.USER, name)
}

export function loadDateWindow() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DATE_WINDOW)
    if (!data) return null
    const { start, end } = JSON.parse(data)
    if (!start || !end) return null
    return { start: new Date(start), end: new Date(end) }
  } catch {
    return null
  }
}

export function saveDateWindow(start, end) {
  try {
    localStorage.setItem(STORAGE_KEYS.DATE_WINDOW, JSON.stringify({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    }))
  } catch {}
}

/** Per-day AI coach text keyed by YYYY-MM-DD */
export function loadDayInsights() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DAY_INSIGHTS)
    if (!data) return {}
    const parsed = JSON.parse(data)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDayInsights(map) {
  try {
    localStorage.setItem(STORAGE_KEYS.DAY_INSIGHTS, JSON.stringify(map))
  } catch {}
}

/** Unified horizon AI insights: keys `day:YYYY-MM-DD`, `week:2026-W13`, `month:2026-04`, `year:2026` */
export function loadHorizonInsights() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HORIZON_INSIGHTS)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    }
    const legacy = localStorage.getItem(STORAGE_KEYS.DAY_INSIGHTS)
    if (legacy) {
      const old = JSON.parse(legacy)
      if (old && typeof old === 'object' && !Array.isArray(old)) {
        const next = {}
        for (const k of Object.keys(old)) {
          next[`day:${k}`] = old[k]
        }
        return next
      }
    }
  } catch {}
  return {}
}

export function saveHorizonInsights(map) {
  try {
    localStorage.setItem(STORAGE_KEYS.HORIZON_INSIGHTS, JSON.stringify(map))
  } catch {}
}

const INSIGHT_PROMPT_KINDS = new Set(['day', 'week', 'month', 'year'])

/** @returns {Record<string, string>} optional overrides per bucket kind */
export function loadInsightSystemPrompts() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INSIGHT_SYSTEM_PROMPTS)
    if (!data) return {}
    const parsed = JSON.parse(data)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out = {}
    for (const k of Object.keys(parsed)) {
      if (!INSIGHT_PROMPT_KINDS.has(k)) continue
      const v = parsed[k]
      if (typeof v === 'string' && v.trim() !== '') out[k] = v.trim()
    }
    return out
  } catch {
    return {}
  }
}

export function saveInsightSystemPrompts(map) {
  try {
    localStorage.setItem(STORAGE_KEYS.INSIGHT_SYSTEM_PROMPTS, JSON.stringify(map))
  } catch {}
}

export function loadHorizonTab() {
  try {
    const t = localStorage.getItem(STORAGE_KEYS.HORIZON_TAB)
    if (t === 'day' || t === 'week' || t === 'month' || t === 'year') return t
  } catch {}
  return 'day'
}

export function saveHorizonTab(tab) {
  try {
    localStorage.setItem(STORAGE_KEYS.HORIZON_TAB, tab)
  } catch {}
}

export function loadWeekWindow() {
  try {
    const d = localStorage.getItem(STORAGE_KEYS.WEEK_WINDOW)
    if (!d) return null
    const { first, last } = JSON.parse(d)
    if (first && last) return { first, last }
  } catch {}
  return null
}

export function saveWeekWindow(firstWeekId, lastWeekId) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEK_WINDOW, JSON.stringify({ first: firstWeekId, last: lastWeekId }))
  } catch {}
}

export function loadMonthWindow() {
  try {
    const d = localStorage.getItem(STORAGE_KEYS.MONTH_WINDOW)
    if (!d) return null
    const { first, last } = JSON.parse(d)
    if (first && last) return { first, last }
  } catch {}
  return null
}

export function saveMonthWindow(firstMonthId, lastMonthId) {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTH_WINDOW, JSON.stringify({ first: firstMonthId, last: lastMonthId }))
  } catch {}
}

export function loadYearWindow() {
  try {
    const d = localStorage.getItem(STORAGE_KEYS.YEAR_WINDOW)
    if (!d) return null
    const { first, last } = JSON.parse(d)
    if (first != null && last != null) return { first: String(first), last: String(last) }
  } catch {}
  return null
}

export function saveYearWindow(firstYear, lastYear) {
  try {
    localStorage.setItem(STORAGE_KEYS.YEAR_WINDOW, JSON.stringify({ first: String(first), last: String(last) }))
  } catch {}
}
