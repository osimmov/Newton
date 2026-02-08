/**
 * Task - Single task item with checkbox, title, description, and actions
 * Supports: complete/incomplete, edit title, edit description, delete
 */

import { useState } from 'react'
import { useTasks } from '../context/TaskContext'

function Task({ task }) {
  const { toggleTask, updateTask, deleteTask } = useTasks()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showDescription, setShowDescription] = useState(false)
  const [editDescription, setEditDescription] = useState(task.description || '')

  function handleSaveTitle() {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed })
    } else if (!trimmed) {
      setEditTitle(task.title)
    }
    setIsEditing(false)
  }

  function handleSaveDescription() {
    updateTask(task.id, { description: editDescription })
    setShowDescription(false)
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

      {/* Title / Description */}
      <div className="flex-1 min-w-0">
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
            className={`text-newton-text text-sm cursor-text ${task.completed ? 'line-through text-newton-muted' : ''}`}
          >
            {task.title}
          </span>
        )}
        {task.description && !showDescription && (
          <p className="text-xs text-newton-muted mt-0.5 truncate" onClick={() => setShowDescription(true)}>
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

      {/* Actions: Edit (circular arrow), Description toggle, Delete */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded-full hover:bg-newton-surface text-newton-muted hover:text-newton-text transition-colors"
          title="Edit task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={() => (task.description || showDescription ? setShowDescription(!showDescription) : setShowDescription(true))}
          className="p-1 rounded hover:bg-newton-surface text-newton-muted hover:text-newton-text transition-colors"
          title="Edit description"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          className="p-1 rounded hover:bg-red-500/20 text-newton-muted hover:text-red-400 transition-colors"
          title="Delete task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Task
