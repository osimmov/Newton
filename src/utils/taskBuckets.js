/**
 * Task horizon buckets: day (default), week (ISO Mon–Sun), month, year.
 */

export const BUCKET_KIND = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
}

export function isDayScopedTask(t) {
  return !t.weekId && !t.monthId && !t.yearId
}

export function taskBucketKind(t) {
  if (t.weekId) return BUCKET_KIND.WEEK
  if (t.monthId) return BUCKET_KIND.MONTH
  if (t.yearId) return BUCKET_KIND.YEAR
  return BUCKET_KIND.DAY
}

export function taskBucketId(t) {
  if (t.weekId) return t.weekId
  if (t.monthId) return t.monthId
  if (t.yearId) return t.yearId
  return t.dayId
}

export function tasksInBucket(tasks, kind, id) {
  if (kind === BUCKET_KIND.DAY) {
    return tasks.filter((t) => isDayScopedTask(t) && t.dayId === id)
  }
  if (kind === BUCKET_KIND.WEEK) return tasks.filter((t) => t.weekId === id)
  if (kind === BUCKET_KIND.MONTH) return tasks.filter((t) => t.monthId === id)
  if (kind === BUCKET_KIND.YEAR) return tasks.filter((t) => t.yearId === id)
  return []
}

export function migrateTaskFromStorage(t) {
  if (t.weekId || t.monthId || t.yearId) return t
  const raw = t.dayId
  if (raw != null && String(raw).trim() !== '') {
    return { ...t, dayId: String(raw).trim() }
  }
  return { ...t }
}
