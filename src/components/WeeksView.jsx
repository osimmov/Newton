/**
 * Horizontal ISO week columns (Mon–Sun), infinite scroll.
 */

import { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react'
import HorizonBucketColumn from './HorizonBucketColumn'
import { HorizonBucketDndProvider } from './HorizonBucketDndProvider'
import {
  weekIdFromDate,
  mondayFromWeekId,
  listWeekIdsBetween,
  formatWeekTitle,
  formatWeekRangeLabel,
  shiftWeekId,
} from '../utils/calendarHorizon'
import { loadWeekWindow, saveWeekWindow } from '../utils/storage'
import { BUCKET_KIND } from '../utils/taskBuckets'

const WINDOW_WEEKS = 20
const EXPAND_WEEKS = 8
const EDGE_THRESHOLD = 100
const COOLDOWN_MS = 0
const COLUMN_WIDTH = 280

function defaultWeekWindow() {
  const cw = weekIdFromDate(new Date())
  const mon = mondayFromWeekId(cw)
  const first = shiftWeekId(cw, -WINDOW_WEEKS)
  const last = shiftWeekId(cw, WINDOW_WEEKS)
  return { first, last }
}

export default function WeeksView() {
  const [{ first: firstWeekId, last: lastWeekId }, setRange] = useState(() => {
    const saved = loadWeekWindow()
    if (saved?.first && saved?.last) return { first: saved.first, last: saved.last }
    return defaultWeekWindow()
  })

  useEffect(() => {
    saveWeekWindow(firstWeekId, lastWeekId)
  }, [firstWeekId, lastWeekId])

  const weekIds = useMemo(() => {
    const a = mondayFromWeekId(firstWeekId)
    const b = mondayFromWeekId(lastWeekId)
    if (!a || !b) return []
    return listWeekIdsBetween(a, b)
  }, [firstWeekId, lastWeekId])

  const currentWeekId = weekIdFromDate(new Date())
  const scrollRef = useRef(null)
  const hasScrolledRef = useRef(false)
  const lastExpandLeftRef = useRef(0)
  const lastExpandRightRef = useRef(0)
  const justExpandedLeftRef = useRef(false)

  const expandLeft = useCallback(() => {
    const now = Date.now()
    if (now - lastExpandLeftRef.current < COOLDOWN_MS) return
    lastExpandLeftRef.current = now
    justExpandedLeftRef.current = true
    setRange((r) => ({ first: shiftWeekId(r.first, -EXPAND_WEEKS), last: r.last }))
  }, [])

  const expandRight = useCallback(() => {
    const now = Date.now()
    if (now - lastExpandRightRef.current < COOLDOWN_MS) return
    lastExpandRightRef.current = now
    setRange((r) => ({ first: r.first, last: shiftWeekId(r.last, EXPAND_WEEKS) }))
  }, [])

  useLayoutEffect(() => {
    if (!justExpandedLeftRef.current) return
    const c = scrollRef.current
    if (c) c.scrollLeft += EXPAND_WEEKS * COLUMN_WIDTH
    justExpandedLeftRef.current = false
  }, [firstWeekId])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const maxScroll = scrollWidth - clientWidth
      if (maxScroll <= 0) return
      if (scrollLeft < EDGE_THRESHOLD) expandLeft()
      if (scrollLeft > maxScroll - EDGE_THRESHOLD) expandRight()
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [expandLeft, expandRight])

  useLayoutEffect(() => {
    if (hasScrolledRef.current) return
    const container = scrollRef.current
    if (!container || weekIds.length === 0) return
    const idx = weekIds.indexOf(currentWeekId)
    if (idx < 0) return
    const apply = () => {
      const maxScroll = container.scrollWidth - container.clientWidth
      container.scrollLeft = Math.max(
        0,
        Math.min(maxScroll, idx * COLUMN_WIDTH - container.clientWidth / 2 + COLUMN_WIDTH / 2)
      )
    }
    apply()
    if (container.clientWidth === 0) requestAnimationFrame(apply)
    hasScrolledRef.current = true
  }, [weekIds, currentWeekId])

  function scrollToCurrentWeek() {
    const container = scrollRef.current
    if (!container) return
    const el = container.querySelector('[data-current-week="true"]')
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
      <HorizonBucketDndProvider bucketKind={BUCKET_KIND.WEEK}>
        <main
          ref={scrollRef}
          className="flex-1 flex overflow-x-scroll overflow-y-hidden min-h-0 min-w-0 hide-scrollbar"
        >
          {weekIds.map((wid) => (
            <HorizonBucketColumn
              key={wid}
              bucketKind={BUCKET_KIND.WEEK}
              bucketId={wid}
              title={formatWeekTitle(wid)}
              subtitle={formatWeekRangeLabel(wid)}
              isHighlight={wid === currentWeekId}
              data-current-week={wid === currentWeekId ? 'true' : undefined}
            />
          ))}
        </main>
      </HorizonBucketDndProvider>

      <button
        type="button"
        onClick={scrollToCurrentWeek}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-newton-surface border border-newton-border text-newton-text text-sm font-medium hover:bg-newton-border/50 hover:border-newton-muted transition-colors shadow-lg z-10"
      >
        This week
      </button>
    </div>
  )
}
