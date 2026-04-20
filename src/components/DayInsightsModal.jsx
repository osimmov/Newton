/**
 * Modal for horizon AI coach insights (Ollama or Claude via proxy). No completed tasks in bucket: fixed copy, no API call.
 * Per–horizon-kind system prompt is editable (Days / Weeks / Months / Years are independent).
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { BUCKET_KIND } from '../utils/taskBuckets'
import { INSIGHTS_PROVIDER } from '../utils/constants'
import MarkdownContent from './MarkdownContent'

const TITLE = {
  [BUCKET_KIND.DAY]: 'Day',
  [BUCKET_KIND.WEEK]: 'Week',
  [BUCKET_KIND.MONTH]: 'Month',
  [BUCKET_KIND.YEAR]: 'Year',
}

const EMPTY_COPY = {
  [BUCKET_KIND.DAY]: 'No completed tasks on this day.',
  [BUCKET_KIND.WEEK]: 'No completed tasks on the days of this week and no tasks on the week column.',
  [BUCKET_KIND.MONTH]: 'No completed tasks on the days of this month and no tasks on the month column.',
  [BUCKET_KIND.YEAR]: 'No completed tasks in this year.',
}

const BILLING_HINT_RE = /credit|balance|billing|too low|purchase credits|plans?\s*&?\s*billing/i
const AUTH_HINT_RE = /invalid x-api-key|authentication_error|api key/i

/** Prefer plain message if `error` is raw Anthropic JSON. */
function insightErrorDisplay(error) {
  if (!error || typeof error !== 'string') return error
  const t = error.trim()
  if (!t.startsWith('{')) return error
  try {
    const j = JSON.parse(t)
    const msg = j?.error?.message
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
  } catch {
    /* ignore */
  }
  return error
}

function ClaudeErrorHint({ message }) {
  if (BILLING_HINT_RE.test(message)) {
    return (
      <>
        Add credits or a paid plan in{' '}
        <a
          href="https://console.anthropic.com/settings/plans"
          target="_blank"
          rel="noopener noreferrer"
          className="text-newton-text underline hover:no-underline"
        >
          Anthropic Plans &amp; billing
        </a>
        . The API key is fine; this is an account balance limit.
      </>
    )
  }
  if (AUTH_HINT_RE.test(message)) {
    return (
      <>
        Check <code className="bg-newton-surface px-1 rounded">ANTHROPIC_API_KEY</code> in{' '}
        <code className="bg-newton-surface px-1 rounded">.env</code> (full key starting with{' '}
        <code className="bg-newton-surface px-1 rounded">sk-ant-</code>).
      </>
    )
  }
  return (
    <>
      Run <code className="bg-newton-surface px-1 rounded">npm run dev:coach-proxy</code> (or{' '}
      <code className="bg-newton-surface px-1 rounded">npm run dev:full</code>), restart{' '}
      <code className="bg-newton-surface px-1 rounded">npm run dev</code> after changing{' '}
      <code className="bg-newton-surface px-1 rounded">VITE_*</code>, and see{' '}
      <code className="bg-newton-surface px-1 rounded">.env.example</code>.
    </>
  )
}

export default function DayInsightsModal({
  horizonKind = BUCKET_KIND.DAY,
  dateLabel,
  onClose,
  response,
  error,
  loading,
  onRegenerate,
  modelName,
  entryCount,
  effectiveSystemPrompt = '',
  defaultSystemPrompt = '',
  onSaveSystemPrompt,
}) {
  const popupRef = useRef(null)
  const titleWord = TITLE[horizonKind] || 'Horizon'
  const emptyCopy = EMPTY_COPY[horizonKind] || EMPTY_COPY[BUCKET_KIND.DAY]
  const errorDisplay = insightErrorDisplay(error)

  const [promptEditorOpen, setPromptEditorOpen] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState(effectiveSystemPrompt)

  const openPromptEditor = useCallback(() => {
    setDraftPrompt(effectiveSystemPrompt)
    setPromptEditorOpen(true)
  }, [effectiveSystemPrompt])

  const closePromptEditor = useCallback(() => {
    setPromptEditorOpen(false)
    setDraftPrompt(effectiveSystemPrompt)
  }, [effectiveSystemPrompt])

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose()
    }
    function handleEscape(e) {
      if (e.key !== 'Escape') return
      if (promptEditorOpen) {
        closePromptEditor()
        e.stopPropagation()
        return
      }
      onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, promptEditorOpen, closePromptEditor])

  const handleSavePrompt = () => {
    onSaveSystemPrompt?.(draftPrompt)
    setPromptEditorOpen(false)
  }

  const handleResetPrompt = () => {
    onSaveSystemPrompt?.('')
    setDraftPrompt(defaultSystemPrompt)
  }

  const isEmpty = entryCount === 0
  const canEditPrompt = typeof onSaveSystemPrompt === 'function'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={popupRef}
        className="w-full max-w-lg max-h-[85vh] flex flex-col bg-newton-surface border border-newton-border rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="horizon-insights-title"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-newton-border flex-shrink-0">
          <h2 id="horizon-insights-title" className="text-base font-semibold text-newton-text truncate min-w-0">
            {titleWord} insights · {dateLabel}
          </h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canEditPrompt && (
              <button
                type="button"
                onClick={() => (promptEditorOpen ? closePromptEditor() : openPromptEditor())}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  promptEditorOpen
                    ? 'bg-newton-border text-newton-text'
                    : 'text-newton-muted hover:bg-newton-charcoal hover:text-newton-text'
                }`}
                aria-expanded={promptEditorOpen}
                aria-controls="insight-prompt-editor"
              >
                Edit prompt
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-newton-charcoal text-newton-muted hover:text-newton-text transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {canEditPrompt && promptEditorOpen && (
          <div
            id="insight-prompt-editor"
            className="px-4 py-3 border-b border-newton-border bg-newton-charcoal/40 flex-shrink-0 space-y-2"
          >
            <p className="text-xs text-newton-muted leading-snug">
              System instructions for the coach on <span className="text-newton-text">{titleWord}</span> columns
              only. Other timeline panels keep their own prompts. Use Regenerate after saving to refresh this insight
              with the new instructions.
            </p>
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              className="w-full min-h-[120px] max-h-[40vh] text-sm text-newton-text bg-newton-surface border border-newton-border rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-newton-muted"
              spellCheck={false}
              aria-label="Coach system prompt"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSavePrompt}
                className="px-3 py-1.5 rounded-lg bg-newton-text text-newton-surface text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Save prompt
              </button>
              <button
                type="button"
                onClick={closePromptEditor}
                className="px-3 py-1.5 rounded-lg border border-newton-border text-newton-muted text-xs hover:bg-newton-charcoal hover:text-newton-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPrompt}
                className="px-3 py-1.5 rounded-lg text-newton-muted text-xs hover:text-newton-text transition-colors ml-auto"
              >
                Reset to default
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {isEmpty && <p className="text-newton-muted text-sm">{emptyCopy}</p>}

          {!isEmpty && error && (
            <div className="rounded-lg bg-red-900/20 border border-red-800/50 text-red-200 text-sm p-3">
              {errorDisplay}
              <p className="mt-2 text-newton-muted text-xs">
                {INSIGHTS_PROVIDER === 'claude' ? (
                  <ClaudeErrorHint message={errorDisplay} />
                ) : (
                  <>
                    Make sure Ollama is running and the model is pulled:{' '}
                    <code className="bg-newton-surface px-1 rounded">ollama pull {modelName}</code>
                  </>
                )}
              </p>
            </div>
          )}

          {!isEmpty && response && (
            <MarkdownContent>{response}</MarkdownContent>
          )}

          {!isEmpty && loading && !response && !error && (
            <p className="text-newton-muted text-sm">Generating…</p>
          )}

          {!isEmpty && !loading && !response && !error && (
            <p className="text-newton-muted text-sm">Preparing insights…</p>
          )}
        </div>

        {!isEmpty && (
          <div className="px-4 py-3 border-t border-newton-border flex-shrink-0">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-newton-charcoal hover:bg-newton-border text-newton-text text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating…' : 'Regenerate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
