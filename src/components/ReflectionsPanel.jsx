/**
 * ReflectionsPanel — chat with local LLM about productivity, grounded in task activity log.
 */

import { useState, useRef, useEffect } from 'react'
import { useReflections } from '../context/ReflectionsContext'
import MarkdownContent from './MarkdownContent'

const EXAMPLE_PROMPTS = [
  'Compare my productivity this week vs last week',
  'How many tasks did I complete this week?',
  'What was my most productive day recently?',
]

function ReflectionsPanel() {
  const { messages, loading, error, sendMessage, clearChat, changeLogLength, modelName, provider } =
    useReflections()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, error])

  function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    const t = draft.trim()
    if (!t) return
    setDraft('')
    sendMessage(t)
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <aside className="flex flex-col flex-1 min-w-0 w-full bg-newton-charcoal min-h-0">
      <div className="flex-shrink-0 px-4 py-3 border-b border-newton-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-newton-text">AI Reflections</h2>
          <p className="text-sm text-newton-muted mt-1">
            Ask about your productivity. Replies use your task activity log.
            {provider === 'claude' ? ` Powered by ${modelName}.` : ' Local model via Ollama.'}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            disabled={loading}
            className="flex-shrink-0 text-sm text-newton-muted hover:text-newton-text px-2 py-1 transition-colors disabled:opacity-50"
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-newton-muted">
              {changeLogLength === 0
                ? 'Complete or add some tasks first so there is activity to analyze.'
                : 'Try one of these, or type your own question:'}
            </p>
            {changeLogLength > 0 && (
              <ul className="space-y-2">
                {EXAMPLE_PROMPTS.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => sendMessage(q)}
                      disabled={loading}
                      className="text-left w-full text-sm text-newton-text bg-newton-surface/60 hover:bg-newton-surface border border-newton-border px-3 py-2 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="w-full flex">
            <div
              className={`w-full px-3 py-2 border ${
                m.role === 'user'
                  ? 'bg-newton-surface border-newton-border text-newton-text text-sm whitespace-pre-wrap leading-relaxed'
                  : 'bg-newton-charcoal border-newton-border/80 text-newton-text'
              }`}
            >
              {m.role === 'user' ? m.content : <MarkdownContent>{m.content}</MarkdownContent>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="w-full">
            <div className="w-full text-sm text-newton-muted px-3 py-2 border border-newton-border/80 bg-newton-charcoal">
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-800/50 text-red-200 text-sm p-3">
            {error}
            {provider !== 'claude' && (
              <p className="mt-2 text-newton-muted text-xs">
                Check Ollama is running and the model is available:{' '}
                <code className="bg-newton-surface px-1 rounded">ollama pull {modelName}</code>
              </p>
            )}
            {provider === 'claude' && (
              <p className="mt-2 text-newton-muted text-xs">
                Check that the coach proxy is running:{' '}
                <code className="bg-newton-surface px-1 rounded">npm run dev:coach-proxy</code>
              </p>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 border-t border-newton-border px-4 py-3 flex gap-2 items-stretch"
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your productivity…"
          rows={2}
          disabled={loading}
          className="flex-1 min-w-0 resize-none bg-newton-surface border border-newton-border rounded px-3 py-2 text-sm text-newton-text placeholder-newton-muted focus:outline-none focus:ring-1 focus:ring-newton-muted disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          className="flex-shrink-0 inline-flex items-center justify-center px-4 bg-newton-surface hover:bg-newton-border border border-newton-border rounded text-newton-text text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </aside>
  )
}

export default ReflectionsPanel
