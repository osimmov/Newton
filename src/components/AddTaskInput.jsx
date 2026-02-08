/**
 * AddTaskInput - Input field to add a new task to a specific day
 */

import { useState } from 'react'
import { useTasks } from '../context/TaskContext'

function AddTaskInput({ dayId }) {
  const { addTask } = useTasks()
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      addTask(dayId, trimmed)
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add..."
        className="w-full bg-transparent border border-newton-border rounded px-3 py-2 text-sm text-newton-text placeholder-newton-muted focus:outline-none focus:ring-1 focus:ring-newton-muted focus:border-transparent"
      />
    </form>
  )
}

export default AddTaskInput
