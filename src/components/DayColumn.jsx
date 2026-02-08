/**
 * DayColumn - Single day column in the infinite timeline
 * Shows day name, full date, task list, and Add input
 * No header buttons - add via input only
 */

import { useTasks } from '../context/TaskContext'
import Task from './Task'
import AddTaskInput from './AddTaskInput'
import { DAYS } from '../utils/constants'

function DayColumn({ dayId, date, isToday, ...rest }) {
  const dayName = DAYS[date.getDay()]
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div
      className={`flex flex-col min-w-[280px] flex-shrink-0 border-r border-newton-border ${isToday ? 'bg-newton-surface/30' : ''}`}
      data-day-id={dayId}
      {...rest}
    >
      {/* Header - no buttons */}
      <div className="flex items-start justify-between gap-2 px-4 py-4 border-b border-newton-border">
        <div>
          <h2 className="text-lg font-semibold text-newton-text">{dayName}</h2>
          <p className="text-sm text-newton-muted mt-0.5">{dateStr}</p>
        </div>
      </div>

      {/* Task list + Add input */}
      <div className="flex-1 min-h-0 px-4 py-3 overflow-y-auto">
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
