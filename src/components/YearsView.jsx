/**
 * Horizontal year columns, infinite scroll.
 */

import { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react'
import HorizonBucketColumn from './HorizonBucketColumn'
import { HorizonBucketDndProvider } from './HorizonBucketDndProvider'
import { listYearsBetween, yearIdFromDate } from '../utils/calendarHorizon'
import { loadYearWindow, saveYearWindow } from '../utils/storage'
import { BUCKET_KIND } from '../utils/taskBuckets'

const WINDOW_YEARS = 8
const EXPAND_YEARS = 4
const EDGE_THRESHOLD = 100
const COOLDOWN_MS = 0
const COLUMN_WIDTH = 280

function defaultYearWindow() {
  const y = Number(yearIdFromDate(new Date()))
  return { first: String(y - WINDOW_YEARS), last: String(y + WINDOW_YEARS) }
}

export default function YearsView() {
  const [{ first: firstYear, last: lastYear }, setRange] = useState(() => {
    const saved = loadYearWindow()
    if (saved?.first && saved?.last) return { first: saved.first, last: saved.last }
    return defaultYearWindow()
  })

  useEffect(() => {
    saveYearWindow(firstYear, lastYear)
  }, [firstYear, lastYear])

  const yearIds = useMemo(
    () => listYearsBetween(Number(firstYear), Number(lastYear)),
    [firstYear, lastYear]
  )

  const currentYearId = yearIdFromDate(new Date())
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
    setRange((r) => ({
      first: String(Number(r.first) - EXPAND_YEARS),
      last: r.last,
    }))
  }, [])

  const expandRight = useCallback(() => {
    const now = Date.now()
    if (now - lastExpandRightRef.current < COOLDOWN_MS) return
    lastExpandRightRef.current = now
    setRange((r) => ({
      first: r.first,
      last: String(Number(r.last) + EXPAND_YEARS),
    }))
  }, [])

  useLayoutEffect(() => {
    if (!justExpandedLeftRef.current) return
    const c = scrollRef.current
    if (c) c.scrollLeft += EXPAND_YEARS * COLUMN_WIDTH
    justExpandedLeftRef.current = false
  }, [firstYear])

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
    if (!container || yearIds.length === 0) return
    const idx = yearIds.indexOf(currentYearId)
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
  }, [yearIds, currentYearId])

  function scrollToThisYear() {
    scrollRef.current?.querySelector('[data-current-year="true"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
      <HorizonBucketDndProvider bucketKind={BUCKET_KIND.YEAR}>
        <main
          ref={scrollRef}
          className="flex-1 flex overflow-x-scroll overflow-y-hidden min-h-0 min-w-0 hide-scrollbar"
        >
          {yearIds.map((yid) => (
            <HorizonBucketColumn
              key={yid}
              bucketKind={BUCKET_KIND.YEAR}
              bucketId={yid}
              title={yid}
              subtitle=""
              isHighlight={yid === currentYearId}
              data-current-year={yid === currentYearId ? 'true' : undefined}
            />
          ))}
        </main>
      </HorizonBucketDndProvider>

      <button
        type="button"
        onClick={scrollToThisYear}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-newton-surface border border-newton-border text-newton-text text-sm font-medium hover:bg-newton-border/50 hover:border-newton-muted transition-colors shadow-lg z-10"
      >
        This year
      </button>
    </div>
  )
}
