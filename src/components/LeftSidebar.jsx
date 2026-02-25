/**
 * LeftSidebar - Vertical navigation styled like left-panel.png
 * Three buttons: Main (Days/Tasks), Progress, AI Reflections
 * Active state: white icon + thin white bar on the left
 */

function LeftSidebar({ activeView, onViewChange }) {
  const isMain = activeView === 'main'
  const isProgress = activeView === 'progress'
  const isReflections = activeView === 'reflections'

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-20 w-16 flex flex-col items-center py-4 bg-newton-surface border-r border-newton-border">
      {/* Main page (Days / Tasks view) */}
      <button
        onClick={() => onViewChange('main')}
        className={`relative flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
          isMain ? 'text-newton-text' : 'text-newton-muted hover:text-newton-text hover:bg-newton-charcoal'
        }`}
        title="Days / Tasks"
      >
        {isMain && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-newton-text rounded-r" />
        )}
        {/* Stacked cards icon - represents Days/Tasks view */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </button>

      {/* Progress view */}
      <button
        onClick={() => onViewChange('progress')}
        className={`relative flex items-center justify-center w-12 h-12 rounded-lg mt-2 transition-colors ${
          isProgress ? 'text-newton-text' : 'text-newton-muted hover:text-newton-text hover:bg-newton-charcoal'
        }`}
        title="Progress"
      >
        {isProgress && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-newton-text rounded-r" />
        )}
        {/* Progress / chart icon */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* AI Reflections view */}
      <button
        onClick={() => onViewChange('reflections')}
        className={`relative flex items-center justify-center w-12 h-12 rounded-lg mt-2 transition-colors ${
          isReflections ? 'text-newton-text' : 'text-newton-muted hover:text-newton-text hover:bg-newton-charcoal'
        }`}
        title="AI Reflections"
      >
        {isReflections && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-newton-text rounded-r" />
        )}
        {/* Sparkles / AI icon */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      </button>
    </aside>
  )
}

export default LeftSidebar
