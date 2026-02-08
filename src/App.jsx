/**
 * Newton - Productivity web app
 * Layout: Weekly view (day columns) + Progress panel on the right
 * Architecture: TaskContext for state; LocalStorage for persistence
 */

import { TaskProvider } from './context/TaskContext'
import DayColumn from './components/DayColumn'
import ChangeLog from './components/ChangeLog'

// Get week dates centered around today (show 7 days)
function getWeekDates() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 3) // Start 3 days before (so Wed-Sat visible like design)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }
  return dates
}

function toDayId(date) {
  return date.toISOString().slice(0, 10)
}

function App() {
  const weekDates = getWeekDates()
  const today = new Date().toDateString()

  return (
    <TaskProvider>
      <div className="min-h-screen flex">
        {/* Main weekly view */}
        <main className="flex-1 flex overflow-x-auto">
          {weekDates.map((date) => (
            <DayColumn
              key={toDayId(date)}
              dayId={toDayId(date)}
              date={date}
              isToday={date.toDateString() === today}
            />
          ))}

          {/* Right edge: WEEK label + user icons */}
          <div className="flex flex-col items-center py-6 px-2 border-l border-newton-border flex-shrink-0">
            <span
              className="text-newton-muted text-sm font-medium writing-mode-vertical transform -rotate-180"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              WEEK
            </span>
            <div className="mt-6 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-full bg-newton-surface flex items-center justify-center">
                <svg className="w-5 h-5 text-newton-muted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="w-9 h-9 rounded-full bg-newton-surface border border-newton-border flex items-center justify-center">
                <svg className="w-5 h-5 text-newton-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </main>

        {/* Progress / Changes log panel */}
        <ChangeLog />
      </div>
    </TaskProvider>
  )
}

export default App
