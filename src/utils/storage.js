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
