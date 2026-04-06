/**
 * Calendar helpers for horizon week/month/year columns (local time, ISO weeks Mon–Sun).
 */

/** Monday 00:00:00 local of the week containing `date`. */
export function startOfISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

/** ISO week-year: year of the Thursday of this ISO week. */
export function isoWeekYear(date) {
  const mon = startOfISOWeek(date)
  const thu = new Date(mon)
  thu.setDate(mon.getDate() + 3)
  return thu.getFullYear()
}

/** ISO week number 1–53. */
export function isoWeekNumber(date) {
  const y = isoWeekYear(date)
  const jan4 = new Date(y, 0, 4)
  const w1Mon = startOfISOWeek(jan4)
  const mon = startOfISOWeek(date)
  const diffMs = mon.getTime() - w1Mon.getTime()
  return 1 + Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
}

/** Stable id e.g. 2026-W13 */
export function weekIdFromDate(date) {
  const y = isoWeekYear(date)
  const w = isoWeekNumber(date)
  return `${y}-W${String(w).padStart(2, '0')}`
}

/** Monday Date from week id. */
export function mondayFromWeekId(weekId) {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekId)
  if (!m) return null
  const y = Number(m[1])
  const wn = Number(m[2])
  const jan4 = new Date(y, 0, 4)
  const w1Mon = startOfISOWeek(jan4)
  const mon = new Date(w1Mon)
  mon.setDate(w1Mon.getDate() + (wn - 1) * 7)
  return mon
}

export function sundayFromWeekId(weekId) {
  const mon = mondayFromWeekId(weekId)
  if (!mon) return null
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return sun
}

/** e.g. "30 Mar – 5 Apr" */
export function formatWeekRangeLabel(weekId, locale = 'en-GB') {
  const mon = mondayFromWeekId(weekId)
  const sun = sundayFromWeekId(weekId)
  if (!mon || !sun) return ''
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  return `${fmt.format(mon)} – ${fmt.format(sun)}`
}

export function formatWeekTitle(weekId) {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekId)
  if (!m) return weekId
  return `W${Number(m[2])}, ${m[1]}`
}

/** First day of month local. */
export function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function monthIdFromDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const mo = d.getMonth() + 1
  return `${y}-${String(mo).padStart(2, '0')}`
}

export function dateFromMonthId(monthId) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, 1)
}

export function formatMonthTitle(monthId, locale = 'en-US') {
  const d = dateFromMonthId(monthId)
  if (!d) return monthId
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

export function yearIdFromDate(date) {
  return String(new Date(date).getFullYear())
}

export function listWeekIdsBetween(firstMonday, lastMonday) {
  const out = []
  const d = new Date(firstMonday)
  d.setHours(0, 0, 0, 0)
  const end = new Date(lastMonday)
  end.setHours(0, 0, 0, 0)
  while (d.getTime() <= end.getTime()) {
    out.push(weekIdFromDate(d))
    d.setDate(d.getDate() + 7)
  }
  return out
}

export function listMonthIdsBetween(firstMonthStart, lastMonthStart) {
  const out = []
  const d = startOfMonth(firstMonthStart)
  const end = startOfMonth(lastMonthStart)
  while (d.getTime() <= end.getTime()) {
    out.push(monthIdFromDate(d))
    d.setMonth(d.getMonth() + 1)
  }
  return out
}

export function listYearsBetween(y0, y1) {
  const out = []
  for (let y = y0; y <= y1; y++) out.push(String(y))
  return out
}

export function shiftWeekId(weekId, deltaWeeks) {
  const m = mondayFromWeekId(weekId)
  if (!m) return weekId
  const d = new Date(m)
  d.setDate(d.getDate() + deltaWeeks * 7)
  return weekIdFromDate(d)
}

export function shiftMonthId(monthId, deltaMonths) {
  const d = dateFromMonthId(monthId)
  if (!d) return monthId
  const n = new Date(d)
  n.setMonth(n.getMonth() + deltaMonths)
  return monthIdFromDate(n)
}
