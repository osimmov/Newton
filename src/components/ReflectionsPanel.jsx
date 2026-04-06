/**
 * ReflectionsPanel - UI for AI reflections (state from ReflectionsContext).
 */

import { useReflections } from '../context/ReflectionsContext'

function ReflectionsPanel() {
  const { response, loading, error, generate, changeLogLength, modelName } = useReflections()

  return (
    <aside className="flex flex-col flex-1 min-w-0 max-w-4xl bg-newton-charcoal">
      <div className="px-4 py-4 border-b border-newton-border">
        <h2 className="text-xl font-semibold text-newton-text">AI Reflections</h2>
        <p className="text-sm text-newton-muted mt-1">
          Personalized tips from your activity. Uses a local model (Ollama).
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="mt-3 px-4 py-2 rounded-lg bg-newton-surface hover:bg-newton-border text-newton-text text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating…' : 'Generate reflections'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-800/50 text-red-200 text-sm p-3 mb-3">
            {error}
            <p className="mt-2 text-newton-muted text-xs">
              Make sure Ollama is running and the model is pulled:{' '}
              <code className="bg-newton-surface px-1 rounded">ollama pull {modelName}</code>
            </p>
          </div>
        )}
        {response ? (
          <div className="text-newton-text text-sm whitespace-pre-wrap leading-relaxed">
            {response}
          </div>
        ) : !loading && !error && (
          <p className="text-newton-muted text-sm">
            {changeLogLength === 0
              ? 'Add and complete some tasks, then generate reflections.'
              : 'Click "Generate reflections" to get tips based on your activity.'}
          </p>
        )}
        {loading && !response && !error && (
          <p className="text-newton-muted text-sm">Generating…</p>
        )}
      </div>
    </aside>
  )
}

export default ReflectionsPanel
