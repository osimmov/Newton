/**
 * Task - Single task item with checkbox, title, description indicator
 * No description on main page. Click task opens pop-up.
 * Options menu on hover: Delete only.
 */

import { useState, useRef, useEffect } from 'react'
import { useTasks } from '../context/TaskContext'
import TaskPopUp from './TaskPopUp'

function Task({ task }) {
  const { toggleTask, deleteTask } = useTasks()
  const [menuOpen, setMenuOpen] = useState(false)
  const [popUpOpen, setPopUpOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleRowClick(e) {
    // Don't open pop-up when clicking checkbox or options button
    if (e.target.closest('button')) return
    setPopUpOpen(true)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => e.key === 'Enter' && handleRowClick(e)}
        className="group flex items-center gap-2 py-2 px-1 border-b border-newton-border/50 last:border-b-0 cursor-pointer hover:bg-newton-surface/50 rounded transition-colors"
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
          className="flex-shrink-0 w-5 h-5 rounded border border-newton-border bg-transparent hover:border-newton-muted flex items-center justify-center transition-colors"
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-newton-text" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Title - truncate with ellipsis, expand vertically */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          <span
            className={`text-newton-text text-sm truncate block ${task.completed ? 'line-through text-newton-muted' : ''}`}
          >
            {task.title}
          </span>
          {task.description && (
            <span className="flex-shrink-0 text-newton-muted" title="Has description">
              <svg className="w-4 h-4" viewBox="0 0 16 12" fill="currentColor">
                <rect x="2" y="1" width="6" height="1.5" rx="0.5" />
                <rect x="2" y="5" width="10" height="1.5" rx="0.5" />
                <rect x="2" y="9" width="12" height="1.5" rx="0.5" />
              </svg>
            </span>
          )}
        </div>

        {/* Options button (⋯) - visible on hover */}
        <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded-full hover:bg-newton-surface text-newton-muted hover:text-newton-text transition-colors"
            title="Options"
            aria-expanded={menuOpen}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 min-w-[120px] bg-newton-surface border border-newton-border rounded-lg shadow-lg z-20">
              <button
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); setMenuOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete task
              </button>
            </div>
          )}
        </div>
      </div>

      {popUpOpen && (
        <TaskPopUp
          task={task}
          onClose={() => setPopUpOpen(false)}
        />
      )}
    </>
  )
}

export default Task
