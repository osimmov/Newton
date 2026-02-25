/**
 * Application constants and helpers
 * Using LocalStorage for MVP - can be swapped for REST API / Firebase later
 */

export const STORAGE_KEYS = {
  TASKS: 'newton_tasks',
  CHANGE_LOG: 'newton_change_log',
  USER: 'newton_user',
  DATE_WINDOW: 'newton_date_window',
}

export const ACTIONS = {
  CREATED: 'created',
  EDITED: 'edited',
  COMPLETED: 'completed',
  UNCOMPLETED: 'uncompleted',
  DELETED: 'deleted',
  RESCHEDULED: 'rescheduled',
}

export const ACTION_LABELS = {
  [ACTIONS.CREATED]: 'was created',
  [ACTIONS.EDITED]: 'was edited',
  [ACTIONS.COMPLETED]: 'was marked as done',
  [ACTIONS.UNCOMPLETED]: 'was marked as incomplete',
  [ACTIONS.DELETED]: 'was deleted',
  [ACTIONS.RESCHEDULED]: 'was rescheduled',
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// AI Reflections: local LLM via Ollama (e.g. DeepSeek 7B)
export const OLLAMA_BASE_URL = 'http://localhost:11434'
export const OLLAMA_REFLECTIONS_MODEL = 'deepseek-r1:7b'
