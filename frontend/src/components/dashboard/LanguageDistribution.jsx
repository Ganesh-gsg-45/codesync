import React from 'react'
import { FiCode, FiCpu } from 'react-icons/fi'

const LANG_COLORS = {
  JAVASCRIPT: { bar: 'bg-yellow-400', text: 'text-yellow-400', dot: '#facc15' },
  TYPESCRIPT: { bar: 'bg-blue-400', text: 'text-blue-400', dot: '#60a5fa' },
  PYTHON: { bar: 'bg-emerald-400', text: 'text-emerald-400', dot: '#34d399' },
  JAVA: { bar: 'bg-orange-400', text: 'text-orange-400', dot: '#fb923c' },
  CPP: { bar: 'bg-purple-400', text: 'text-purple-400', dot: '#c084fc' },
  GO: { bar: 'bg-cyan-400', text: 'text-cyan-400', dot: '#22d3ee' },
  RUST: { bar: 'bg-amber-500', text: 'text-amber-500', dot: '#f59e0b' },
  HTML: { bar: 'bg-red-400', text: 'text-red-400', dot: '#f87171' },
  DEFAULT: { bar: 'bg-gray-400', text: 'text-gray-400', dot: '#9ca3af' },
}

export default function LanguageDistribution({ distribution = {} }) {
  const entries = Object.entries(distribution)
  const total = entries.reduce((acc, [, count]) => acc + count, 0)

  if (entries.length === 0 || total === 0) {
    return (
      <div className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <FiCode className="h-4 w-4 text-blue-400" /> Language Distribution
        </h3>
        <div className="mt-4 py-8 text-center text-sm text-gray-400">
          <FiCpu className="mx-auto h-8 w-8 text-gray-600 mb-2" />
          No language metrics yet. Create a room to start tracking.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <FiCode className="h-4 w-4 text-blue-400" /> Language Distribution
        </h3>
        <span className="text-xs text-gray-400">{total} active {total === 1 ? 'room' : 'rooms'}</span>
      </div>

      {/* Multi-segment progress bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#21262d]">
        {entries.map(([lang, count]) => {
          const pct = Math.round((count / total) * 100)
          const style = LANG_COLORS[lang.toUpperCase()] || LANG_COLORS.DEFAULT
          return (
            <div
              key={lang}
              style={{ width: `${pct}%` }}
              className={`${style.bar} transition-all duration-300`}
              title={`${lang}: ${count} (${pct}%)`}
            />
          )
        })}
      </div>

      {/* Legend list */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entries.map(([lang, count]) => {
          const pct = Math.round((count / total) * 100)
          const style = LANG_COLORS[lang.toUpperCase()] || LANG_COLORS.DEFAULT
          return (
            <div key={lang} className="flex items-center justify-between text-xs rounded-lg bg-[#0d1117]/60 px-3 py-2 border border-[#30363d]/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
                <span className="font-mono font-medium text-gray-200">{lang}</span>
              </div>
              <span className="font-semibold text-gray-400">{pct}% ({count})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

