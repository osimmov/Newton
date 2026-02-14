/**
 * LeftSidebar - Vertical navigation styled like left-panel.png
 * Two buttons: Main page (Days/Tasks), Progress view
 * Active state: white icon + thin white bar on the left
 */

function LeftSidebar({ activeView, onViewChange }) {
  const isMain = activeView === 'main'
  const isProgress = activeView === 'progress'

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
    </aside>
  )
}

export default LeftSidebar
