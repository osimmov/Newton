/**
 * Newton - Productivity web app
 * Layout: Left sidebar (Main / Progress) + main content area
 * Progress panel slides in from left, aligned with sidebar.
 */

import { useState } from 'react'
import { TaskProvider } from './context/TaskContext'
import { ReflectionsProvider } from './context/ReflectionsContext'
import { DayInsightsProvider } from './context/DayInsightsContext'
import LeftSidebar from './components/LeftSidebar'
import HorizonMainView from './components/HorizonMainView'
import ChangeLog from './components/ChangeLog'
import ReflectionsPanel from './components/ReflectionsPanel'

function App() {
  const [activeView, setActiveView] = useState('main')

  return (
    <TaskProvider>
      <ReflectionsProvider>
        <DayInsightsProvider>
        <LeftSidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Main content: offset by sidebar width so it never goes under the fixed sidebar */}
        <div className="min-h-screen flex pl-16">
          {activeView === 'main' && <HorizonMainView />}

          {/* Progress panel: slides in from left, aligned with sidebar */}
          {activeView === 'progress' && (
            <div
              className="flex-1 flex overflow-hidden"
              style={{ animation: 'slideInLeft 0.25s ease-out forwards' }}
            >
              <ChangeLog fullView />
            </div>
          )}

          {/* AI Reflections panel */}
          {activeView === 'reflections' && (
            <div
              className="flex-1 flex min-w-0 w-full overflow-hidden"
              style={{ animation: 'slideInLeft 0.25s ease-out forwards' }}
            >
              <ReflectionsPanel />
            </div>
          )}
        </div>
        </DayInsightsProvider>
      </ReflectionsProvider>
    </TaskProvider>
  )
}

export default App
