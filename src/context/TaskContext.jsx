/**
 * TaskContext - Central state for tasks and change log
 * Architecture: Single source of truth for tasks; every mutation logs to ChangeLog
 * Persists to LocalStorage on each update for MVP simplicity
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { loadTasks, saveTasks, loadChangeLog, saveChangeLog, loadUser } from '../utils/storage'
import { ACTIONS } from '../utils/constants'

const TaskContext = createContext(null)

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function logId() {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function taskReducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      return { tasks: action.tasks, changeLog: action.changeLog, user: action.user }
    }
    case 'ADD_TASK': {
      const newTask = {
        id: generateId(),
        dayId: action.dayId,
        title: action.title.trim(),
        description: action.description || '',
        completed: false,
        createdAt: new Date().toISOString(),
      }
      const tasks = [...state.tasks, newTask]
      const logEntry = {
        id: logId(),
        action: ACTIONS.CREATED,
        taskId: newTask.id,
        taskName: newTask.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'TOGGLE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task) return state
      const completed = !task.completed
      const tasks = state.tasks.map((t) =>
        t.id === action.taskId ? { ...t, completed } : t
      )
      const logEntry = {
        id: logId(),
        action: completed ? ACTIONS.COMPLETED : ACTIONS.UNCOMPLETED,
        taskId: task.id,
        taskName: task.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'UPDATE_TASK': {
      const prev = state.tasks.find((t) => t.id === action.taskId)
      if (!prev) return state
      const updates = { ...action.updates }
      const tasks = state.tasks.map((t) =>
        t.id === action.taskId ? { ...t, ...updates } : t
      )
      const logEntry = {
        id: logId(),
        action: ACTIONS.EDITED,
        taskId: prev.id,
        taskName: updates.title ?? prev.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'DELETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task) return state
      const tasks = state.tasks.filter((t) => t.id !== action.taskId)
      const logEntry = {
        id: logId(),
        action: ACTIONS.DELETED,
        taskId: task.id,
        taskName: task.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'RESCHEDULE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || task.dayId === action.newDayId) return state
      const tasks = state.tasks.map((t) =>
        t.id === action.taskId ? { ...t, dayId: action.newDayId } : t
      )
      const logEntry = {
        id: logId(),
        action: ACTIONS.RESCHEDULED,
        taskId: task.id,
        taskName: task.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
        metadata: { fromDay: task.dayId, toDay: action.newDayId },
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'SET_USER': {
      return { ...state, user: action.user }
    }
    default:
      return state
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    changeLog: [],
    user: 'saidamir osimov',
  })

  useEffect(() => {
    const tasks = loadTasks()
    const changeLog = loadChangeLog()
    const user = loadUser()
    dispatch({ type: 'INIT', tasks, changeLog, user })
  }, [])

  useEffect(() => {
    if (state.tasks.length > 0 || state.changeLog.length > 0) {
      saveTasks(state.tasks)
      saveChangeLog(state.changeLog)
    }
  }, [state.tasks, state.changeLog])

  const addTask = useCallback((dayId, title, description = '') => {
    dispatch({ type: 'ADD_TASK', dayId, title, description })
  }, [])

  const toggleTask = useCallback((taskId) => {
    dispatch({ type: 'TOGGLE_TASK', taskId })
  }, [])

  const updateTask = useCallback((taskId, updates) => {
    dispatch({ type: 'UPDATE_TASK', taskId, updates })
  }, [])

  const deleteTask = useCallback((taskId) => {
    dispatch({ type: 'DELETE_TASK', taskId })
  }, [])

  const rescheduleTask = useCallback((taskId, newDayId) => {
    dispatch({ type: 'RESCHEDULE_TASK', taskId, newDayId })
  }, [])

  const value = {
    tasks: state.tasks,
    changeLog: state.changeLog,
    user: state.user,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    rescheduleTask,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
