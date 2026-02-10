/**
 * DaysView - Infinite horizontal scrolling timeline (TimeStripe-style)
 *
 * Implementation: Date-based window (±30 days initially). Expansion triggers only
 * when user scrolls near left/right edge (scroll position guard) + throttling
 * to prevent feedback loops. Backend-friendly: can swap for API date fetches.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import DayColumn from './DayColumn'

const WINDOW_SIZE = 30 // days before/after center
const EXPAND_BY = 14 // days to add when near edge
const SCROLL_THRESHOLD = 400 // px from edge to trigger expansion
const EXPAND_COOLDOWN_MS = 800 // min ms between expansions to prevent loops

function toDayId(date) {
  return date.toISOString().slice(0, 10)
}

function getDates(start, end) {
  const dates = []
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  const endTime = new Date(end).getTime()
  while (d.getTime() <= endTime) {
    dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function DaysView() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const initialStart = new Date(today)
  initialStart.setDate(today.getDate() - WINDOW_SIZE)
  const initialEnd = new Date(today)
  initialEnd.setDate(today.getDate() + WINDOW_SIZE)

  const [windowStart, setWindowStart] = useState(initialStart)
  const [windowEnd, setWindowEnd] = useState(initialEnd)
  const scrollRef = useRef(null)
  const lastExpandRef = useRef(0)

  const dates = getDates(windowStart, windowEnd)
  const todayStr = today.toDateString()

  const expandLeft = useCallback(() => {
    const now = Date.now()
    if (now - lastExpandRef.current < EXPAND_COOLDOWN_MS) return
    lastExpandRef.current = now
    setWindowStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - EXPAND_BY)
      return next
    })
  }, [])

  const expandRight = useCallback(() => {
    const now = Date.now()
    if (now - lastExpandRef.current < EXPAND_COOLDOWN_MS) return
    lastExpandRef.current = now
    setWindowEnd((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + EXPAND_BY)
      return next
    })
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    function handleScroll() {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const nearLeft = scrollLeft < SCROLL_THRESHOLD
      const nearRight = scrollLeft > scrollWidth - clientWidth - SCROLL_THRESHOLD

      if (nearLeft) expandLeft()
      if (nearRight) expandRight()
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [expandLeft, expandRight])

  function scrollToToday() {
    const container = scrollRef.current
    if (!container) return
    const todayCol = container.querySelector('[data-today="true"]')
    if (todayCol) {
      todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  // Scroll to today on mount
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const todayCol = container.querySelector('[data-today="true"]')
    if (todayCol) {
      todayCol.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' })
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
    <main
      ref={scrollRef}
      className="flex-1 flex overflow-x-auto overflow-y-hidden min-h-0"
    >
      {dates.map((date) => (
        <DayColumn
          key={toDayId(date)}
          dayId={toDayId(date)}
          date={date}
          isToday={date.toDateString() === todayStr}
          data-today={date.toDateString() === todayStr ? 'true' : undefined}
        />
      ))}
    </main>

    {/* Fixed Today button at bottom */}
    <button
      onClick={scrollToToday}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-newton-surface border border-newton-border text-newton-text text-sm font-medium hover:bg-newton-border/50 hover:border-newton-muted transition-colors shadow-lg z-10"
    >
      Today
    </button>
    </div>
  )
}

export default DaysView
