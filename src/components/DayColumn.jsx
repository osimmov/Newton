/**
 * DayColumn - Single day column in the weekly view
 * Shows day name, full date, task list, and Add input
 */

import { useTasks } from '../context/TaskContext'
import Task from './Task'
import AddTaskInput from './AddTaskInput'
import { DAYS } from '../utils/constants'

function DayColumn({ dayId, date, isToday }) {
  const dayName = DAYS[date.getDay()]
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div
      className={`flex flex-col min-w-[220px] flex-1 border-r border-newton-border last:border-r-0 ${isToday ? 'bg-newton-surface/30' : ''}`}
      data-day-id={dayId}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-4 border-b border-newton-border">
        <div>
          <h2 className="text-lg font-semibold text-newton-text">{dayName}</h2>
          <p className="text-sm text-newton-muted mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-newton-surface text-newton-muted hover:text-newton-text transition-colors" title="Add task">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="p-1.5 rounded hover:bg-newton-surface text-newton-muted hover:text-newton-text transition-colors" title="More options">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Task list + Add input — will receive tasks via props from parent */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {/* Tasks are rendered by parent and passed as children, or we need to pass tasks */}
        <DayTasks dayId={dayId} />
        <AddTaskInput dayId={dayId} />
      </div>
    </div>
  )
}

// Inner component that consumes context to filter tasks by day
function DayTasks({ dayId }) {
  const { tasks } = useTasks()
  const dayTasks = tasks.filter((t) => t.dayId === dayId)
  return (
    <>
      {dayTasks.map((task) => (
        <Task key={task.id} task={task} />
      ))}
    </>
  )
}

export default DayColumn
