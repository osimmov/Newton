/**
 * DaysView - Horizontal timeline showing a fixed window of days (±WINDOW_SIZE from today).
 * Today is centered on first view. Today button scrolls back to today.
 */

import { useRef, useLayoutEffect } from 'react'
import DayColumn from './DayColumn'

const WINDOW_SIZE = 30 // days before/after today
const COLUMN_WIDTH = 280 // must match DayColumn width

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
  const windowStart = new Date(today)
  windowStart.setDate(today.getDate() - WINDOW_SIZE)
  const windowEnd = new Date(today)
  windowEnd.setDate(today.getDate() + WINDOW_SIZE)

  const scrollRef = useRef(null)
  const hasScrolledToTodayRef = useRef(false)

  const dates = getDates(windowStart, windowEnd)
  const todayStr = today.toDateString()

  function scrollToToday() {
    const container = scrollRef.current
    if (!container) return
    const todayCol = container.querySelector('[data-today="true"]')
    if (todayCol) {
      todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  useLayoutEffect(() => {
    if (hasScrolledToTodayRef.current) return
    const container = scrollRef.current
    if (!container) return
    const todayIndex = dates.findIndex((d) => d.toDateString() === todayStr)
    if (todayIndex < 0) return
    const applyScroll = () => {
      const maxScroll = container.scrollWidth - container.clientWidth
      const scrollLeft = Math.max(0, Math.min(maxScroll, todayIndex * COLUMN_WIDTH - container.clientWidth / 2 + COLUMN_WIDTH / 2))
      container.scrollLeft = scrollLeft
    }
    applyScroll()
    if (container.clientWidth === 0) requestAnimationFrame(applyScroll)
    hasScrolledToTodayRef.current = true
  }, [dates, todayStr])

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <main
        ref={scrollRef}
        className="flex-1 flex overflow-x-scroll overflow-y-hidden min-h-0"
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
