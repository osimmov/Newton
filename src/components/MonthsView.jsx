/**
 * Horizontal month columns, infinite scroll.
 */

import { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react'
import HorizonBucketColumn from './HorizonBucketColumn'
import { HorizonBucketDndProvider } from './HorizonBucketDndProvider'
import {
  monthIdFromDate,
  dateFromMonthId,
  listMonthIdsBetween,
  formatMonthTitle,
  shiftMonthId,
} from '../utils/calendarHorizon'
import { loadMonthWindow, saveMonthWindow } from '../utils/storage'
import { BUCKET_KIND } from '../utils/taskBuckets'

const WINDOW_MONTHS = 18
const EXPAND_MONTHS = 6
const EDGE_THRESHOLD = 100
const COOLDOWN_MS = 0
const COLUMN_WIDTH = 280

function defaultMonthWindow() {
  const now = new Date()
  const cur = monthIdFromDate(now)
  return { first: shiftMonthId(cur, -WINDOW_MONTHS), last: shiftMonthId(cur, WINDOW_MONTHS) }
}

export default function MonthsView() {
  const [{ first: firstMonthId, last: lastMonthId }, setRange] = useState(() => {
    const saved = loadMonthWindow()
    if (saved?.first && saved?.last) return { first: saved.first, last: saved.last }
    return defaultMonthWindow()
  })

  useEffect(() => {
    saveMonthWindow(firstMonthId, lastMonthId)
  }, [firstMonthId, lastMonthId])

  const monthIds = useMemo(() => {
    const a = dateFromMonthId(firstMonthId)
    const b = dateFromMonthId(lastMonthId)
    if (!a || !b) return []
    return listMonthIdsBetween(a, b)
  }, [firstMonthId, lastMonthId])

  const currentMonthId = monthIdFromDate(new Date())
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
    setRange((r) => ({ first: shiftMonthId(r.first, -EXPAND_MONTHS), last: r.last }))
  }, [])

  const expandRight = useCallback(() => {
    const now = Date.now()
    if (now - lastExpandRightRef.current < COOLDOWN_MS) return
    lastExpandRightRef.current = now
    setRange((r) => ({ first: r.first, last: shiftMonthId(r.last, EXPAND_MONTHS) }))
  }, [])

  useLayoutEffect(() => {
    if (!justExpandedLeftRef.current) return
    const c = scrollRef.current
    if (c) c.scrollLeft += EXPAND_MONTHS * COLUMN_WIDTH
    justExpandedLeftRef.current = false
  }, [firstMonthId])

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
    if (!container || monthIds.length === 0) return
    const idx = monthIds.indexOf(currentMonthId)
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
  }, [monthIds, currentMonthId])

  function scrollToThisMonth() {
    scrollRef.current?.querySelector('[data-current-month="true"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
      <HorizonBucketDndProvider bucketKind={BUCKET_KIND.MONTH}>
        <main
          ref={scrollRef}
          className="flex-1 flex overflow-x-scroll overflow-y-hidden min-h-0 min-w-0 hide-scrollbar"
        >
          {monthIds.map((mid) => (
            <HorizonBucketColumn
              key={mid}
              bucketKind={BUCKET_KIND.MONTH}
              bucketId={mid}
              title={formatMonthTitle(mid)}
              subtitle=""
              isHighlight={mid === currentMonthId}
              data-current-month={mid === currentMonthId ? 'true' : undefined}
            />
          ))}
        </main>
      </HorizonBucketDndProvider>

      <button
        type="button"
        onClick={scrollToThisMonth}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-newton-surface border border-newton-border text-newton-text text-sm font-medium hover:bg-newton-border/50 hover:border-newton-muted transition-colors shadow-lg z-10"
      >
        This month
      </button>
    </div>
  )
}
