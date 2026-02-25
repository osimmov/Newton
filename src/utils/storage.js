/**
 * LocalStorage persistence layer
 * Abstracts storage - can be replaced with API calls for backend migration
 */

import { STORAGE_KEYS } from './constants'

export function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
}

export function loadChangeLog() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHANGE_LOG)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveChangeLog(entries) {
  localStorage.setItem(STORAGE_KEYS.CHANGE_LOG, JSON.stringify(entries))
}

export function loadUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER)
    return data || 'saidamir osimov'
  } catch {
    return 'saidamir osimov'
  }
}

export function saveUser(name) {
  localStorage.setItem(STORAGE_KEYS.USER, name)
}

export function loadDateWindow() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DATE_WINDOW)
    if (!data) return null
    const { start, end } = JSON.parse(data)
    if (!start || !end) return null
    return { start: new Date(start), end: new Date(end) }
  } catch {
    return null
  }
}

export function saveDateWindow(start, end) {
  try {
    localStorage.setItem(STORAGE_KEYS.DATE_WINDOW, JSON.stringify({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    }))
  } catch {}
}
