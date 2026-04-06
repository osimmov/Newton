/**
 * Task - Single task item with checkbox, title, description indicator
 * No description on main page. Click title area opens pop-up. @dnd-kit sortable for live reorder.
 */

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTasks } from '../context/TaskContext'
import { useHorizonDndUi } from '../context/HorizonDndUiContext'
import TaskPopUp from './TaskPopUp'

const CLICK_SUPPRESS_MS = 200

function Task({ task }) {
  const { toggleTask, deleteTask } = useTasks()
  const horizonDnd = useHorizonDndUi()
  const [menuOpen, setMenuOpen] = useState(false)
  const [popUpOpen, setPopUpOpen] = useState(false)
  const menuRef = useRef(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0.35 } : {}),
  }

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
    if (e.target.closest('button')) return
    const ref = horizonDnd?.lastDragEndAtRef
    if (ref && Date.now() - ref.current < CLICK_SUPPRESS_MS) return
    setPopUpOpen(true)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        data-task-row
        role="button"
        tabIndex={0}
        {...attributes}
        style={style}
        onClick={handleRowClick}
        onKeyDown={(e) => e.key === 'Enter' && handleRowClick(e)}
        className="group flex items-center gap-2 py-2 px-1 border-b border-newton-border/50 last:border-b-0 hover:bg-newton-surface/50 rounded transition-colors select-none"
      >
        {/* Checkbox — not a drag activator */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleTask(task.id)
          }}
          className="flex-shrink-0 w-5 h-5 rounded border border-newton-border bg-transparent hover:border-newton-muted flex items-center justify-center transition-colors"
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-newton-text" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Title + description icon — drag activator */}
        <div
          {...listeners}
          className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        >
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

        {/* Options button (⋯) */}
        <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteTask(task.id)
                  setMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete task
              </button>
            </div>
          )}
        </div>
      </div>

      {popUpOpen && <TaskPopUp task={task} onClose={() => setPopUpOpen(false)} />}
    </>
  )
}

export default Task
