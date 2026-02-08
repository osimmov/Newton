/**
 * DaysView - Infinite horizontal scrolling timeline (TimeStripe-style)
 *
 * Implementation: Date-based window (±30 days initially). Scroll sentinels at
 * left/right edges trigger window expansion when user scrolls toward them.
 * Backend-friendly: window boundaries can be replaced with API calls to fetch
 * date ranges on demand. Virtualization could be added later for 100+ days.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import DayColumn from './DayColumn'

const WINDOW_SIZE = 30 // days before/after center
const EXPAND_BY = 14 // days to add when near edge

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

  const dates = getDates(windowStart, windowEnd)
  const todayStr = today.toDateString()

  const expandLeft = useCallback(() => {
    setWindowStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - EXPAND_BY)
      return next
    })
  }, [])

  const expandRight = useCallback(() => {
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
        for (const e of entries) {
          if (!e.isIntersecting) continue
          if (e.target === leftSentinel) expandLeft()
          if (e.target === rightSentinel) expandRight()
        }
      },
      { root: container, rootMargin: '400px', threshold: 0 }
    )

    observer.observe(leftSentinel)
    observer.observe(rightSentinel)
    return () => observer.disconnect()
  }, [expandLeft, expandRight, dates.length])

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
    <main
      ref={scrollRef}
      className="flex-1 flex overflow-x-auto overflow-y-hidden min-h-0"
    >
      {/* Left sentinel - triggers expansion when scrolling into past */}
      <div ref={leftSentinelRef} className="flex-shrink-0 w-1 min-h-[1px]" aria-hidden />

      {dates.map((date) => (
        <DayColumn
          key={toDayId(date)}
          dayId={toDayId(date)}
          date={date}
          isToday={date.toDateString() === todayStr}
          data-today={date.toDateString() === todayStr ? 'true' : undefined}
        />
      ))}

      {/* Right sentinel - triggers expansion when scrolling into future */}
      <div ref={rightSentinelRef} className="flex-shrink-0 w-1 min-h-[1px]" aria-hidden />
    </main>
  )
}

export default DaysView
