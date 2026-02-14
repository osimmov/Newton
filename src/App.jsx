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
      <LeftSidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main content: offset by sidebar width so it never goes under the fixed sidebar */}
      <div className="min-h-screen flex pl-16">
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
