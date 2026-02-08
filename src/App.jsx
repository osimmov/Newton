/**
 * Newton - Productivity web app
 * Layout: Left sidebar (Main / Progress) + main content area
 * Main page: infinite horizontal days. Progress: separate view, not shown by default.
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
        {activeView === 'progress' && (
          <div className="flex-1 flex overflow-hidden">
            <ChangeLog fullView />
          </div>
        )}
      </div>
    </TaskProvider>
  )
}

export default App
