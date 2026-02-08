/**
 * Application constants and helpers
 * Using LocalStorage for MVP - can be swapped for REST API / Firebase later
 */

export const STORAGE_KEYS = {
  TASKS: 'newton_tasks',
  CHANGE_LOG: 'newton_change_log',
  USER: 'newton_user',
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
  [ACTIONS.CREATED]: 'was created by',
  [ACTIONS.EDITED]: 'was edited by',
  [ACTIONS.COMPLETED]: 'was marked as done by',
  [ACTIONS.UNCOMPLETED]: 'was marked as incomplete by',
  [ACTIONS.DELETED]: 'was deleted by',
  [ACTIONS.RESCHEDULED]: 'was rescheduled by',
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
