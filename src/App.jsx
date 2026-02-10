/**
 * Newton - Productivity web app
 * Layout: Left sidebar (Main / Progress) + main content area
 * Progress panel slides in from left, aligned with sidebar.
 */

import { useState } from 'react'
import { TaskProvider } from './context/TaskContext'
import LeftSidebar from './components/LeftSidebar'
import DaysView from './components/DaysView'
import ChangeLog from './components/ChangeLog'

function App() {
  const [activeView, setActiveView] = useState('main')

  return (
    <TaskProvider>
      <div className="min-h-screen flex">
        <LeftSidebar activeView={activeView} onViewChange={setActiveView} />

        {activeView === 'main' && <DaysView />}

        {/* Progress panel: slides in from left, aligned with sidebar */}
        {activeView === 'progress' && (
          <div
            className="flex-1 flex overflow-hidden"
            style={{ animation: 'slideInLeft 0.25s ease-out forwards' }}
          >
            <ChangeLog fullView />
          </div>
        )}
      </div>
    </TaskProvider>
  )
}

export default App
