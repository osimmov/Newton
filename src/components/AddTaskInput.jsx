/**
 * AddTaskInput - Input field to add a new task to a specific day
 * Enter creates task. Blur (click outside) also creates task.
 */

import { useState, useRef } from 'react'
import { useTasks } from '../context/TaskContext'

function AddTaskInput({ dayId }) {
  const { addTask } = useTasks()
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  function commitTask() {
    const trimmed = value.trim()
    if (trimmed) {
      addTask(dayId, trimmed)
      setValue('')
    }
  }

  function handleBlur() {
    commitTask()
  }

  function handleSubmit(e) {
    e.preventDefault()
    commitTask()
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add..."
        className="w-full bg-transparent border border-newton-border rounded px-3 py-2 text-sm text-newton-text placeholder-newton-muted focus:outline-none focus:ring-1 focus:ring-newton-muted focus:border-transparent"
      />
    </form>
  )
}

export default AddTaskInput
