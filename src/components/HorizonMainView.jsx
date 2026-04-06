/**
 * Main horizon: sub-panel (Day / Week / Month / Year) + active timeline view.
 */

import { useState, useEffect } from 'react'
import DaysView from './DaysView'
import WeeksView from './WeeksView'
import MonthsView from './MonthsView'
import YearsView from './YearsView'
import { loadHorizonTab, saveHorizonTab } from '../utils/storage'

const TABS = [
  { id: 'day', label: 'Days' },
  { id: 'week', label: 'Weeks' },
  { id: 'month', label: 'Months' },
  { id: 'year', label: 'Years' },
]

export default function HorizonMainView() {
  const [tab, setTab] = useState(() => loadHorizonTab())

  useEffect(() => {
    saveHorizonTab(tab)
  }, [tab])

  return (
    <div className="flex-1 flex min-h-0 min-w-0">
      <nav
        className="w-36 flex-shrink-0 border-r border-newton-border bg-newton-charcoal/40 flex flex-col py-4 px-2 gap-0.5"
        aria-label="Horizon scale"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-newton-surface text-newton-text'
                : 'text-newton-muted hover:text-newton-text hover:bg-newton-charcoal'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {tab === 'day' && <DaysView />}
        {tab === 'week' && <WeeksView />}
        {tab === 'month' && <MonthsView />}
        {tab === 'year' && <YearsView />}
      </div>
    </div>
  )
}
