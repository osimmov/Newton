/**
 * Task - Single task item with checkbox, title, description
 * Actions hidden by default; on hover a single ⋯ options button appears.
 * Clicking options reveals dropdown: Edit task, Edit description, Delete
 */

import { useState, useRef, useEffect } from 'react'
import { useTasks } from '../context/TaskContext'

function Task({ task }) {
  const { toggleTask, updateTask, deleteTask } = useTasks()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showDescription, setShowDescription] = useState(false)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
  }, [task.title, task.description])

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

  function handleSaveTitle() {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed })
    } else if (!trimmed) {
      setEditTitle(task.title)
    }
    setIsEditing(false)
    setMenuOpen(false)
  }

  function handleSaveDescription() {
    updateTask(task.id, { description: editDescription })
    setShowDescription(false)
    setMenuOpen(false)
  }

  return (
    <div className="group flex items-start gap-2 py-2 px-1 border-b border-newton-border/50 last:border-b-0">
      {/* Checkbox */}
      <button
        onClick={() => toggleTask(task.id)}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border border-newton-border bg-transparent hover:border-newton-muted flex items-center justify-center transition-colors"
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && (
          <svg className="w-3 h-3 text-newton-text" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Title / Description - more space */}
      <div className="flex-1 min-w-0 pr-1">
        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            className="w-full bg-newton-surface border border-newton-border rounded px-2 py-1 text-sm text-newton-text focus:outline-none focus:ring-1 focus:ring-newton-muted"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`text-newton-text text-sm cursor-text block ${task.completed ? 'line-through text-newton-muted' : ''}`}
          >
            {task.title}
          </span>
        )}
        {task.description && !showDescription && (
          <p className="text-xs text-newton-muted mt-0.5 truncate cursor-text" onClick={() => setShowDescription(true)}>
            {task.description}
          </p>
        )}
        {showDescription && (
          <div className="mt-1">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onBlur={handleSaveDescription}
              placeholder="Add description..."
              rows={2}
              className="w-full bg-newton-surface border border-newton-border rounded px-2 py-1 text-xs text-newton-text placeholder-newton-accent focus:outline-none focus:ring-1 focus:ring-newton-muted resize-none"
            />
          </div>
        )}
      </div>

      {/* Single options button (⋯) - visible on hover only */}
      <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded hover:bg-newton-surface text-newton-muted hover:text-newton-text transition-colors"
          title="Options"
          aria-expanded={menuOpen}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] bg-newton-surface border border-newton-border rounded-lg shadow-lg z-10">
            <button
              onClick={() => { setIsEditing(true); setMenuOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-newton-text hover:bg-newton-charcoal transition-colors"
            >
              Edit task
            </button>
            <button
              onClick={() => { setShowDescription(true); setMenuOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-newton-text hover:bg-newton-charcoal transition-colors"
            >
              Edit description
            </button>
            <button
              onClick={() => { deleteTask(task.id); setMenuOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete task
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Task
