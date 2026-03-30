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

/** Assign sequential order within each day (migration + consistency). */
function normalizeTaskOrders(tasks) {
  const byDay = new Map()
  for (const t of tasks) {
    if (!byDay.has(t.dayId)) byDay.set(t.dayId, [])
    byDay.get(t.dayId).push(t)
  }
  const idToOrder = new Map()
  for (const [, arr] of byDay) {
    const sorted = [...arr].sort((a, b) => {
      const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
      const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
      if (oa !== ob) return oa - ob
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    sorted.forEach((t, i) => idToOrder.set(t.id, i))
  }
  return tasks.map((t) => ({ ...t, order: idToOrder.get(t.id) ?? 0 }))
}

function maxOrderForDay(tasks, dayId) {
  return tasks.filter((t) => t.dayId === dayId).reduce((m, t) => Math.max(m, typeof t.order === 'number' ? t.order : -1), -1)
}

function sortTasksForDay(tasks, dayId) {
  return tasks
    .filter((t) => t.dayId === dayId)
    .sort((a, b) => {
      const oa = typeof a.order === 'number' ? a.order : 0
      const ob = typeof b.order === 'number' ? b.order : 0
      if (oa !== ob) return oa - ob
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
}

function taskReducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      return {
        tasks: normalizeTaskOrders(action.tasks),
        changeLog: action.changeLog,
        user: action.user,
      }
    }
    case 'ADD_TASK': {
      const nextOrder = maxOrderForDay(state.tasks, action.dayId) + 1
      const newTask = {
        id: generateId(),
        dayId: action.dayId,
        title: action.title.trim(),
        description: action.description || '',
        completed: false,
        createdAt: new Date().toISOString(),
        order: nextOrder,
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
      const taskTitle = updates.title ?? prev.title
      let message = null
      if (updates.description !== undefined) {
        const prevDesc = (prev.description || '').trim()
        const newDesc = (updates.description || '').trim()
        if (!prevDesc && newDesc) {
          message = `added description to the ${taskTitle} task`
        } else if (prevDesc && newDesc && prev.description !== updates.description) {
          message = `the description of ${taskTitle} was changed`
        }
      }
      const logEntry = {
        id: logId(),
        action: ACTIONS.EDITED,
        taskId: prev.id,
        taskName: taskTitle,
        timestamp: new Date().toISOString(),
        userId: state.user,
        ...(message && { message }),
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
    case 'REORDER_TASKS_IN_DAY': {
      const { dayId, orderedIds } = action
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]))
      const tasks = state.tasks.map((t) =>
        t.dayId === dayId && orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t
      )
      return { ...state, tasks }
    }
    case 'MOVE_TASK_TO_DAY': {
      const { taskId, targetDayId, insertIndex } = action
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return state
      const sourceDayId = task.dayId
      if (sourceDayId === targetDayId) return state

      const targetSorted = sortTasksForDay(state.tasks, targetDayId).map((t) => t.id)
      const insertAt = Math.max(0, Math.min(insertIndex, targetSorted.length))
      const newTargetIds = [...targetSorted.slice(0, insertAt), taskId, ...targetSorted.slice(insertAt)]

      const sourceSorted = sortTasksForDay(state.tasks, sourceDayId)
        .filter((t) => t.id !== taskId)
        .map((t) => t.id)

      const tasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, dayId: targetDayId, order: newTargetIds.indexOf(taskId) }
        }
        if (t.dayId === targetDayId) {
          const o = newTargetIds.indexOf(t.id)
          return o === -1 ? t : { ...t, order: o }
        }
        if (t.dayId === sourceDayId) {
          const o = sourceSorted.indexOf(t.id)
          return o === -1 ? t : { ...t, order: o }
        }
        return t
      })

      const logEntry = {
        id: logId(),
        action: ACTIONS.RESCHEDULED,
        taskId: task.id,
        taskName: task.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
        metadata: { fromDay: sourceDayId, toDay: targetDayId },
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
      const othersOnNewDay = state.tasks.filter((t) => t.dayId === action.newDayId && t.id !== task.id)
      const nextOrder = othersOnNewDay.reduce((m, t) => Math.max(m, typeof t.order === 'number' ? t.order : -1), -1) + 1
      const tasks = state.tasks.map((t) =>
        t.id === action.taskId ? { ...t, dayId: action.newDayId, order: nextOrder } : t
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

  const reorderTasksInDay = useCallback((dayId, orderedIds) => {
    dispatch({ type: 'REORDER_TASKS_IN_DAY', dayId, orderedIds })
  }, [])

  const moveTaskToDay = useCallback((taskId, targetDayId, insertIndex) => {
    dispatch({ type: 'MOVE_TASK_TO_DAY', taskId, targetDayId, insertIndex })
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
    reorderTasksInDay,
    moveTaskToDay,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
