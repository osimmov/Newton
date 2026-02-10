/**
 * TaskPopUp - Centered modal for viewing/editing task details
 * Title editable inline, description field. Closes via X or click outside.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTasks } from '../context/TaskContext'

function TaskPopUp({ task, onClose }) {
  const { toggleTask, updateTask } = useTasks()
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const popupRef = useRef(null)
  const editTitleRef = useRef(editTitle)
  const editDescriptionRef = useRef(editDescription)
  editTitleRef.current = editTitle
  editDescriptionRef.current = editDescription

  useEffect(() => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
  }, [task.id, task.title, task.description])

  const saveAndClose = useCallback(() => {
    const title = editTitleRef.current?.trim() || task.title
    const desc = editDescriptionRef.current ?? task.description ?? ''
    if (title) updateTask(task.id, { title, description: desc })
    onClose()
  }, [task.id, task.title, task.description, onClose, updateTask])

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        saveAndClose()
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') saveAndClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [saveAndClose])

  function handleTitleBlur() {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed })
    } else if (!trimmed) {
      setEditTitle(task.title)
    }
  }

  function handleDescriptionBlur() {
    updateTask(task.id, { description: editDescription })
  }

  const dateStr = task.dayId ? new Date(task.dayId + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={popupRef}
        className="w-full max-w-md max-h-[80vh] flex flex-col bg-newton-surface border border-newton-border rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: date (orange) + close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-newton-border">
          <span className="text-sm text-newton-today font-medium">{dateStr}</span>
          <button
            onClick={saveAndClose}
            className="p-1.5 rounded hover:bg-newton-charcoal text-newton-muted hover:text-newton-text transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task title + checkbox */}
        <div className="flex items-start gap-3 px-4 py-4">
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
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className={`flex-1 bg-transparent text-lg font-semibold text-newton-text focus:outline-none focus:ring-0 border-none p-0 ${task.completed ? 'line-through text-newton-muted' : ''}`}
            placeholder="Task title"
          />
        </div>

        {/* Description field */}
        <div className="px-4 pb-4 flex-1 min-h-0">
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
            placeholder="Add note"
            rows={4}
            className="w-full bg-newton-charcoal border border-newton-border rounded-lg px-3 py-2 text-sm text-newton-text placeholder-newton-muted focus:outline-none focus:ring-1 focus:ring-newton-muted resize-none"
          />
        </div>
      </div>
    </div>
  )
}

export default TaskPopUp
