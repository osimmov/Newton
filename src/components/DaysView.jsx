/**
 * DaysView - Infinite horizontal scrolling timeline (TimeStripe-style)
 *
 * Uses IntersectionObserver on left/right sentinels: when a sentinel comes into
 * view (user scrolled to that edge), we expand the date window. Zero rootMargin
 * so we only expand when the sentinel is actually visible. 800ms cooldown
 * prevents loops. Backend-friendly: can swap for API date fetches.
 */

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import DayColumn from './DayColumn'

const WINDOW_SIZE = 30 // days before/after center
const EXPAND_BY = 14 // days to add when near edge
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
  const leftSentinelRef = useRef(null)
  const rightSentinelRef = useRef(null)
  const lastExpandRef = useRef(0)
  const hasScrolledToTodayRef = useRef(false)

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
    const leftSentinel = leftSentinelRef.current
    const rightSentinel = rightSentinelRef.current
    if (!container || !leftSentinel || !rightSentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (entry.target === leftSentinel) expandLeft()
          if (entry.target === rightSentinel) expandRight()
        }
      },
      {
        root: container,
        rootMargin: '0px',
        threshold: 0,
      }
    )

    observer.observe(leftSentinel)
    observer.observe(rightSentinel)
    return () => observer.disconnect()
  }, [expandLeft, expandRight])

  function scrollToToday() {
    const container = scrollRef.current
    if (!container) return
    const todayCol = container.querySelector('[data-today="true"]')
    if (todayCol) {
      todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  // Scroll to today when Days view is first shown so the user sees Today first (once per mount)
  useLayoutEffect(() => {
    if (hasScrolledToTodayRef.current) return
    const container = scrollRef.current
    if (!container) return
    const scrollToTodayCol = () => {
      const todayCol = container.querySelector('[data-today="true"]')
      if (todayCol) {
        hasScrolledToTodayRef.current = true
        todayCol.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' })
      }
    }
    scrollToTodayCol()
    requestAnimationFrame(() => requestAnimationFrame(scrollToTodayCol))
  }, [])

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
    <main
      ref={scrollRef}
      className="flex-1 flex overflow-x-scroll overflow-y-hidden min-h-0"
    >
      <div ref={leftSentinelRef} className="flex-shrink-0 w-px min-h-full" aria-hidden />
      {dates.map((date) => (
        <DayColumn
          key={toDayId(date)}
          dayId={toDayId(date)}
          date={date}
          isToday={date.toDateString() === todayStr}
          data-today={date.toDateString() === todayStr ? 'true' : undefined}
        />
      ))}
      <div ref={rightSentinelRef} className="flex-shrink-0 w-px min-h-full" aria-hidden />
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
