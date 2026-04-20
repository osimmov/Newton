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

// AI: local LLM via Ollama (insights + reflections). Pull first: ollama pull gemma4
// Other tags: gemma4:e2b, gemma4:e4b, gemma4:26b, gemma4:31b — see https://ollama.com/library/gemma4
export const OLLAMA_BASE_URL = 'http://localhost:11434'
export const OLLAMA_REFLECTIONS_MODEL = 'gemma4'

/** Horizon insights: `claude` when VITE_INSIGHTS_PROVIDER=claude (see .env.example); else Ollama / gemma4. */
export const INSIGHTS_PROVIDER =
  import.meta.env.VITE_INSIGHTS_PROVIDER === 'claude' ? 'claude' : 'ollama'

const coachProxyBase = (import.meta.env.VITE_COACH_PROXY_URL || '').replace(/\/$/, '')

/** POST target for Claude insights: Vite proxies /api/coach → coach proxy in dev. */
export const COACH_INSIGHTS_URL = coachProxyBase
  ? `${coachProxyBase}/insights`
  : '/api/coach/insights'

/** POST target for Claude multi-turn chat (Reflections panel). */
export const COACH_CHAT_URL = coachProxyBase
  ? `${coachProxyBase}/chat`
  : '/api/coach/chat'

/** Label shown in the insights modal (not used for API when provider is Claude). */
export function getInsightsModelDisplayName() {
  if (INSIGHTS_PROVIDER === 'claude') {
    const label = import.meta.env.VITE_INSIGHTS_MODEL_LABEL
    return (typeof label === 'string' && label.trim()) || 'Claude (API)'
  }
  return OLLAMA_REFLECTIONS_MODEL
}
