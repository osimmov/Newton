/**
 * DaysView - Horizontal timeline with infinite scroll.
 * Initial: 30 days each side of today (61 blocks). At left/right edge, add 14 more days in that direction.
 * Trigger: scroll position (scrollLeft near 0 = left edge, near max = right edge). 800ms cooldown per direction.
 */

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import DayColumn from './DayColumn'
import { loadDateWindow, saveDateWindow } from '../utils/storage'

const WINDOW_SIZE = 30 // days before/after today (61 blocks initial)
const EXPAND_DAYS = 14 // days to add when user hits an edge
const EDGE_THRESHOLD = 100 // px from edge to trigger expansion
const COOLDOWN_MS = 0 // min ms between expansions per direction
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

  const [windowStart, setWindowStart] = useState(() => {
    const saved = loadDateWindow()
    if (saved?.start && saved?.end) {
      const s = new Date(saved.start)
      const e = new Date(saved.end)
      s.setHours(0, 0, 0, 0)
      e.setHours(0, 0, 0, 0)
      if (s.getTime() <= e.getTime()) return s
    }
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    t.setDate(t.getDate() - WINDOW_SIZE)
    return t
  })
  const [windowEnd, setWindowEnd] = useState(() => {
    const saved = loadDateWindow()
    if (saved?.start && saved?.end) {
      const s = new Date(saved.start)
      const e = new Date(saved.end)
      s.setHours(0, 0, 0, 0)
      e.setHours(0, 0, 0, 0)
      if (s.getTime() <= e.getTime()) return e
    }
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    t.setDate(t.getDate() + WINDOW_SIZE)
    return t
  })

  useEffect(() => {
    saveDateWindow(windowStart, windowEnd)
  }, [windowStart, windowEnd])
  const scrollRef = useRef(null)
  const hasScrolledToTodayRef = useRef(false)
  const lastExpandLeftRef = useRef(0)
  const lastExpandRightRef = useRef(0)
  const justExpandedLeftRef = useRef(false)

  const dates = getDates(windowStart, windowEnd)
  const todayStr = today.toDateString()

  const expandLeft = useCallback(() => {
    const now = Date.now()
    const blocked = now - lastExpandLeftRef.current < COOLDOWN_MS
    // #region agent log
    fetch('http://127.0.0.1:7693/ingest/d4c085ae-a28d-4795-8b22-2314b7032411',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cf797a'},body:JSON.stringify({sessionId:'cf797a',location:'DaysView.jsx:expandLeft',message:'expandLeft',data:{blocked},hypothesisId:'D',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (blocked) return
    lastExpandLeftRef.current = now
    justExpandedLeftRef.current = true
    setWindowStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - EXPAND_DAYS)
      return next
    })
  }, [])

  const expandRight = useCallback(() => {
    const now = Date.now()
    const blocked = now - lastExpandRightRef.current < COOLDOWN_MS
    // #region agent log
    fetch('http://127.0.0.1:7693/ingest/d4c085ae-a28d-4795-8b22-2314b7032411',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cf797a'},body:JSON.stringify({sessionId:'cf797a',location:'DaysView.jsx:expandRight',message:'expandRight',data:{blocked},hypothesisId:'D',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (blocked) return
    lastExpandRightRef.current = now
    setWindowEnd((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + EXPAND_DAYS)
      return next
    })
  }, [])

  useLayoutEffect(() => {
    if (!justExpandedLeftRef.current) return
    const container = scrollRef.current
    if (container) {
      container.scrollLeft += EXPAND_DAYS * COLUMN_WIDTH
    }
    justExpandedLeftRef.current = false
  }, [windowStart])

  useEffect(() => {
    const container = scrollRef.current
    const sw = container?.scrollWidth ?? 0
    const cw = container?.clientWidth ?? 0
    const max = sw - cw
    // #region agent log
    fetch('http://127.0.0.1:7693/ingest/d4c085ae-a28d-4795-8b22-2314b7032411',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cf797a'},body:JSON.stringify({sessionId:'cf797a',location:'DaysView.jsx:effect',message:'scroll listener setup',data:{hasContainer:!!container,scrollWidth:sw,clientWidth:cw,maxScroll:max},hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!container) return
    let lastLog = 0
    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const maxScroll = scrollWidth - clientWidth
      const hitLeft = maxScroll > 0 && scrollLeft < EDGE_THRESHOLD
      const hitRight = maxScroll > 0 && scrollLeft > maxScroll - EDGE_THRESHOLD
      if (Date.now() - lastLog < 400) return
      lastLog = Date.now()
      // #region agent log
      fetch('http://127.0.0.1:7693/ingest/d4c085ae-a28d-4795-8b22-2314b7032411',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cf797a'},body:JSON.stringify({sessionId:'cf797a',location:'DaysView.jsx:onScroll',message:'scroll',data:{scrollLeft,maxScroll,hitLeft,hitRight},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (maxScroll <= 0) return
      if (hitLeft) expandLeft()
      if (hitRight) expandRight()
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [expandLeft, expandRight])

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
    <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
      <main
        ref={scrollRef}
        className="flex-1 flex overflow-x-scroll overflow-y-hidden min-h-0 min-w-0"
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
