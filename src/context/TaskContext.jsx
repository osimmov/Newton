/**
 * TaskContext - Central state for tasks and change log
 * Tasks live in a horizon bucket: day (default), week, month, or year.
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { loadTasks, saveTasks, loadChangeLog, saveChangeLog, loadUser } from '../utils/storage'
import { ACTIONS } from '../utils/constants'
import {
  BUCKET_KIND,
  isDayScopedTask,
  tasksInBucket,
  migrateTaskFromStorage,
} from '../utils/taskBuckets'

const TaskContext = createContext(null)

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function logId() {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function bucketStorageKey(task) {
  if (task.weekId) return `week:${task.weekId}`
  if (task.monthId) return `month:${task.monthId}`
  if (task.yearId) return `year:${task.yearId}`
  return `day:${task.dayId}`
}

/** Assign sequential order within each bucket (migration + consistency). */
function normalizeTaskOrders(tasks) {
  const byKey = new Map()
  for (const t of tasks) {
    const key = bucketStorageKey(t)
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(t)
  }
  const idToOrder = new Map()
  for (const [, arr] of byKey) {
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

function maxOrderForBucket(tasks, kind, id) {
  return tasksInBucket(tasks, kind, id).reduce((m, t) => Math.max(m, typeof t.order === 'number' ? t.order : -1), -1)
}

function sortTasksForBucket(tasks, kind, id) {
  return tasksInBucket(tasks, kind, id).sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : 0
    const ob = typeof b.order === 'number' ? b.order : 0
    if (oa !== ob) return oa - ob
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function todayDayId() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function rollIncompleteTasksToToday(tasks, todayId) {
  const toRoll = tasks.filter(
    (t) => isDayScopedTask(t) && t.dayId && !t.completed && t.dayId < todayId
  )
  if (toRoll.length === 0) return tasks

  const sortedRoll = [...toRoll].sort((a, b) => {
    if (a.dayId !== b.dayId) return a.dayId.localeCompare(b.dayId)
    return (typeof a.order === 'number' ? a.order : 0) - (typeof b.order === 'number' ? b.order : 0)
  })

  let nextOrder = maxOrderForBucket(tasks, BUCKET_KIND.DAY, todayId) + 1
  const idToNewOrder = new Map()
  for (const t of sortedRoll) {
    idToNewOrder.set(t.id, nextOrder++)
  }

  return tasks.map((t) =>
    idToNewOrder.has(t.id) ? { ...t, dayId: todayId, order: idToNewOrder.get(t.id) } : t
  )
}

function taskWithBucketFields(kind, id) {
  const base = { weekId: undefined, monthId: undefined, yearId: undefined }
  if (kind === BUCKET_KIND.DAY) return { ...base, dayId: id }
  if (kind === BUCKET_KIND.WEEK) return { ...base, dayId: undefined, weekId: id }
  if (kind === BUCKET_KIND.MONTH) return { ...base, dayId: undefined, monthId: id }
  if (kind === BUCKET_KIND.YEAR) return { ...base, dayId: undefined, yearId: id }
  return { ...base, dayId: id }
}

function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

/** Progress / changelog: which horizon strip the event belongs to */
function horizonMetaFromTask(task) {
  if (!task) return {}
  if (task.weekId) return { horizonPanel: 'week', horizonBucketId: task.weekId }
  if (task.monthId) return { horizonPanel: 'month', horizonBucketId: task.monthId }
  if (task.yearId) return { horizonPanel: 'year', horizonBucketId: task.yearId }
  if (task.dayId) return { horizonPanel: 'day', horizonBucketId: task.dayId }
  return { horizonPanel: 'day' }
}

function horizonMetaFromBucketKind(kind, id) {
  const panel =
    kind === BUCKET_KIND.DAY
      ? 'day'
      : kind === BUCKET_KIND.WEEK
        ? 'week'
        : kind === BUCKET_KIND.MONTH
          ? 'month'
          : 'year'
  return { horizonPanel: panel, horizonBucketId: id }
}

/** Day-scoped tasks with missing dayId land on today so they stay visible */
function repairDayScopedDayIds(tasks, todayId) {
  return tasks.map((t) => {
    if (t.weekId || t.monthId || t.yearId) return t
    const d = t.dayId && String(t.dayId).trim()
    if (d) return { ...t, dayId: d }
    return { ...t, dayId: todayId }
  })
}

function taskReducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      const tid = todayDayId()
      const migrated = action.tasks.map(migrateTaskFromStorage)
      const repaired = repairDayScopedDayIds(migrated, tid)
      const normalized = normalizeTaskOrders(repaired)
      const tasks = rollIncompleteTasksToToday(normalized, tid)
      return {
        tasks,
        changeLog: action.changeLog,
        user: action.user,
      }
    }
    case 'ROLL_INCOMPLETE_TO_TODAY': {
      const nextTasks = rollIncompleteTasksToToday(state.tasks, action.todayId)
      if (nextTasks === state.tasks) return state
      return { ...state, tasks: nextTasks }
    }
    case 'ADD_TASK': {
      const nextOrder = maxOrderForBucket(state.tasks, BUCKET_KIND.DAY, action.dayId) + 1
      const newTask = stripUndefined({
        id: generateId(),
        dayId: action.dayId,
        title: action.title.trim(),
        description: action.description || '',
        completed: false,
        createdAt: new Date().toISOString(),
        order: nextOrder,
      })
      const tasks = [...state.tasks, newTask]
      const logEntry = {
        id: logId(),
        action: ACTIONS.CREATED,
        taskId: newTask.id,
        taskName: newTask.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
        metadata: horizonMetaFromBucketKind(BUCKET_KIND.DAY, action.dayId),
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'ADD_TASK_BUCKET': {
      const { kind, id, title, description } = action
      const nextOrder = maxOrderForBucket(state.tasks, kind, id) + 1
      const newTask = stripUndefined({
        id: generateId(),
        ...taskWithBucketFields(kind, id),
        title: title.trim(),
        description: description || '',
        completed: false,
        createdAt: new Date().toISOString(),
        order: nextOrder,
      })
      const tasks = [...state.tasks, newTask]
      const logEntry = {
        id: logId(),
        action: ACTIONS.CREATED,
        taskId: newTask.id,
        taskName: newTask.title,
        timestamp: new Date().toISOString(),
        userId: state.user,
        metadata: horizonMetaFromBucketKind(kind, id),
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
        metadata: horizonMetaFromTask(task),
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
        metadata: horizonMetaFromTask(prev),
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
        metadata: horizonMetaFromTask(task),
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
        isDayScopedTask(t) && t.dayId === dayId && orderMap.has(t.id)
          ? { ...t, order: orderMap.get(t.id) }
          : t
      )
      return { ...state, tasks }
    }
    case 'REORDER_TASKS_IN_BUCKET': {
      const { kind, id, orderedIds } = action
      const orderMap = new Map(orderedIds.map((tid, i) => [tid, i]))
      const idsInBucket = new Set(tasksInBucket(state.tasks, kind, id).map((t) => t.id))
      const tasks = state.tasks.map((t) => {
        if (!idsInBucket.has(t.id) || !orderMap.has(t.id)) return t
        return { ...t, order: orderMap.get(t.id) }
      })
      return { ...state, tasks }
    }
    case 'MOVE_TASK_TO_DAY': {
      const { taskId, targetDayId, insertIndex } = action
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task || !isDayScopedTask(task)) return state
      const sourceDayId = task.dayId
      if (sourceDayId === targetDayId) return state

      const targetSorted = sortTasksForBucket(state.tasks, BUCKET_KIND.DAY, targetDayId).map((t) => t.id)
      const insertAt = Math.max(0, Math.min(insertIndex, targetSorted.length))
      const newTargetIds = [...targetSorted.slice(0, insertAt), taskId, ...targetSorted.slice(insertAt)]

      const sourceSorted = sortTasksForBucket(state.tasks, BUCKET_KIND.DAY, sourceDayId)
        .filter((t) => t.id !== taskId)
        .map((t) => t.id)

      const tasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, dayId: targetDayId, order: newTargetIds.indexOf(taskId) }
        }
        if (isDayScopedTask(t) && t.dayId === targetDayId) {
          const o = newTargetIds.indexOf(t.id)
          return o === -1 ? t : { ...t, order: o }
        }
        if (isDayScopedTask(t) && t.dayId === sourceDayId) {
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
        metadata: {
          fromDay: sourceDayId,
          toDay: targetDayId,
          horizonPanel: 'day',
          horizonBucketId: targetDayId,
        },
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'MOVE_TASK_TO_BUCKET': {
      const { taskId, targetKind, targetId, insertIndex } = action
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return state

      const sourceKind =
        task.weekId ? BUCKET_KIND.WEEK : task.monthId ? BUCKET_KIND.MONTH : task.yearId ? BUCKET_KIND.YEAR : BUCKET_KIND.DAY
      const sourceId = task.weekId || task.monthId || task.yearId || task.dayId
      if (sourceKind === targetKind && sourceId === targetId) return state

      const targetSorted = sortTasksForBucket(state.tasks, targetKind, targetId).map((t) => t.id)
      const insertAt = Math.max(0, Math.min(insertIndex, targetSorted.length))
      const newTargetIds = [...targetSorted.slice(0, insertAt), taskId, ...targetSorted.slice(insertAt)]

      const sourceSorted = sortTasksForBucket(state.tasks, sourceKind, sourceId)
        .filter((t) => t.id !== taskId)
        .map((t) => t.id)

      const bucketFields = taskWithBucketFields(targetKind, targetId)
      const tasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return stripUndefined({
            ...t,
            ...bucketFields,
            order: newTargetIds.indexOf(taskId),
          })
        }
        if (
          (targetKind === BUCKET_KIND.DAY && isDayScopedTask(t) && t.dayId === targetId) ||
          (targetKind === BUCKET_KIND.WEEK && t.weekId === targetId) ||
          (targetKind === BUCKET_KIND.MONTH && t.monthId === targetId) ||
          (targetKind === BUCKET_KIND.YEAR && t.yearId === targetId)
        ) {
          const o = newTargetIds.indexOf(t.id)
          return o === -1 ? t : { ...t, order: o }
        }
        if (
          (sourceKind === BUCKET_KIND.DAY && isDayScopedTask(t) && t.dayId === sourceId) ||
          (sourceKind === BUCKET_KIND.WEEK && t.weekId === sourceId) ||
          (sourceKind === BUCKET_KIND.MONTH && t.monthId === sourceId) ||
          (sourceKind === BUCKET_KIND.YEAR && t.yearId === sourceId)
        ) {
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
        metadata: {
          from: { kind: sourceKind, id: sourceId },
          to: { kind: targetKind, id: targetId },
          horizonPanel: targetKind === BUCKET_KIND.DAY ? 'day' : targetKind === BUCKET_KIND.WEEK ? 'week' : targetKind === BUCKET_KIND.MONTH ? 'month' : 'year',
          horizonBucketId: targetId,
        },
      }
      return {
        ...state,
        tasks,
        changeLog: [logEntry, ...state.changeLog],
      }
    }
    case 'RESCHEDULE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId)
      if (!task || !isDayScopedTask(task) || task.dayId === action.newDayId) return state
      const othersOnNewDay = state.tasks.filter(
        (t) => isDayScopedTask(t) && t.dayId === action.newDayId && t.id !== task.id
      )
      const nextOrder =
        othersOnNewDay.reduce((m, t) => Math.max(m, typeof t.order === 'number' ? t.order : -1), -1) + 1
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
        metadata: {
          fromDay: task.dayId,
          toDay: action.newDayId,
          horizonPanel: 'day',
          horizonBucketId: action.newDayId,
        },
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

  const lastCalendarDayRef = useRef(null)

  useEffect(() => {
    lastCalendarDayRef.current = todayDayId()
    function maybeRollForNewDay() {
      const tid = todayDayId()
      if (tid !== lastCalendarDayRef.current) {
        lastCalendarDayRef.current = tid
        dispatch({ type: 'ROLL_INCOMPLETE_TO_TODAY', todayId: tid })
      }
    }
    const interval = window.setInterval(maybeRollForNewDay, 60_000)
    function onVisibility() {
      if (document.visibilityState === 'visible') maybeRollForNewDay()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
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

  const addTaskToBucket = useCallback((kind, id, title, description = '') => {
    dispatch({ type: 'ADD_TASK_BUCKET', kind, id, title, description })
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

  const reorderTasksInBucket = useCallback((kind, id, orderedIds) => {
    dispatch({ type: 'REORDER_TASKS_IN_BUCKET', kind, id, orderedIds })
  }, [])

  const moveTaskToDay = useCallback((taskId, targetDayId, insertIndex) => {
    dispatch({ type: 'MOVE_TASK_TO_DAY', taskId, targetDayId, insertIndex })
  }, [])

  const moveTaskToBucket = useCallback((taskId, targetKind, targetId, insertIndex) => {
    dispatch({ type: 'MOVE_TASK_TO_BUCKET', taskId, targetKind, targetId, insertIndex })
  }, [])

  const value = {
    tasks: state.tasks,
    changeLog: state.changeLog,
    user: state.user,
    addTask,
    addTaskToBucket,
    toggleTask,
    updateTask,
    deleteTask,
    rescheduleTask,
    reorderTasksInDay,
    reorderTasksInBucket,
    moveTaskToDay,
    moveTaskToBucket,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
