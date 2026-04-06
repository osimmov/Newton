/**
 * Application constants and helpers
 * Using LocalStorage for MVP - can be swapped for REST API / Firebase later
 */

export const STORAGE_KEYS = {
  TASKS: 'newton_tasks',
  CHANGE_LOG: 'newton_change_log',
  USER: 'newton_user',
  DATE_WINDOW: 'newton_date_window',
  DAY_INSIGHTS: 'newton_day_insights_v3',
  HORIZON_TAB: 'newton_horizon_tab',
  WEEK_WINDOW: 'newton_week_window',
  MONTH_WINDOW: 'newton_month_window',
  YEAR_WINDOW: 'newton_year_window',
  HORIZON_INSIGHTS: 'newton_horizon_insights_v1',
  /** Per horizon kind (day | week | month | year): custom system prompts for AI insights */
  INSIGHT_SYSTEM_PROMPTS: 'newton_insight_system_prompts_v1',
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
