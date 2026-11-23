import React from 'react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      glow: 'group-hover:border-blue-500/40',
    },
    cyan: {
      bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      glow: 'group-hover:border-cyan-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'group-hover:border-emerald-500/40',
    },
    purple: {
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      glow: 'group-hover:border-purple-500/40',
    },
  }

  const activeColor = colorMap[color] || colorMap.blue

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]/70 p-5 transition-all duration-200 hover:bg-[#161b22] ${activeColor.glow} backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${activeColor.bg}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}

