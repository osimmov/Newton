/**
 * ChangeLog - Progress panel showing all task actions with timestamps
 * Matches design: grouped by date, action type, task name, user
 */

import { useTasks } from '../context/TaskContext'
import { ACTION_LABELS } from '../utils/constants'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDateHeader(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getActionIcon(action) {
  switch (action) {
    case 'completed':
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    case 'uncompleted':
      return (
        <svg className="w-4 h-4 text-newton-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    case 'created':
    case 'rescheduled':
      return (
        <span className="text-newton-muted text-lg leading-none">✳</span>
      )
    case 'deleted':
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    case 'edited':
    default:
      return (
        <svg className="w-4 h-4 text-newton-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
  }
}

function ChangeLog({ fullView }) {
  const { changeLog } = useTasks()

  // Group entries by date (YYYY-MM-DD)
  const grouped = changeLog.reduce((acc, entry) => {
    const date = entry.timestamp.slice(0, 10)
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <aside
      className={`flex flex-col bg-newton-charcoal border-r border-newton-border ${
        fullView ? 'flex-1 w-[340px] min-w-[340px] max-w-[340px]' : 'w-[340px] flex-shrink-0'
      }`}
    >
      {/* Header - no account or plus buttons */}
      <div className="px-4 py-4 border-b border-newton-border">
        <h2 className="text-xl font-semibold text-newton-text">Progress</h2>
        <div className="flex items-center gap-2 mt-2 text-sm text-newton-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Feb 1 — Today</span>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sortedDates.length === 0 ? (
          <p className="text-sm text-newton-muted">No activity yet</p>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="mb-4">
              <h3 className="text-sm font-medium text-newton-text mb-2">
                {formatDateHeader(date)}
              </h3>
              <div className="space-y-2">
                {grouped[date].map((entry) => (
                  <div
                    key={entry.id}
                    className="flex gap-2 items-start text-sm"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-newton-muted">{formatTime(entry.timestamp)}</span>
                      <span className="text-newton-muted ml-1">
                        <span className="bg-newton-surface px-1.5 py-0.5 rounded text-newton-text">
                          {entry.taskName}
                        </span>
                        {' '}
                        {ACTION_LABELS[entry.action] || 'by'}
                        {' '}
                        {entry.userId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

export default ChangeLog
