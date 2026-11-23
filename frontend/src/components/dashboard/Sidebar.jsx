import React from 'react'
import {
  FiGrid,
  FiFolder,
  FiUsers,
  FiGlobe,
  FiPlus,
  FiLogIn,
  FiLogOut,
  FiCode,
  FiUser,
  FiShield,
  FiActivity,
  FiRadio,
} from 'react-icons/fi'

export default function Sidebar({
  activeTab,
  onSelectTab,
  stats,
  user,
  onLogout,
  onCreateRoom,
  onJoinRoom,
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: FiGrid, count: null },
    { id: 'my-rooms', label: 'My Rooms', icon: FiFolder, count: stats?.myRoomsCount ?? null },
    { id: 'all-rooms', label: 'All Rooms', icon: FiGlobe, count: stats?.activeRooms ?? null },
    { id: 'recent-activity', label: 'Recent Activity', icon: FiActivity, count: stats?.recentRooms?.length ?? null },
  ]

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-[#30363d] bg-[#0d1117] p-4 min-h-[calc(100vh-56px)]">
      <div>
        {/* Quick Action buttons in sidebar */}
        <div className="space-y-2 mb-6">
          <button
            onClick={onCreateRoom}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            <span>Create Room</span>
          </button>
          <button
            onClick={onJoinRoom}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-[#21262d] hover:text-white transition-colors"
          >
            <FiLogIn className="h-4 w-4 text-gray-400" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Workspaces
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-[#161b22] hover:text-gray-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count != null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-[#21262d] text-gray-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Real-time Status Card */}
        <div className="mt-8 rounded-xl border border-[#30363d]/60 bg-[#161b22]/50 p-3.5 text-xs text-gray-400">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>STOMP Gateway Active</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Real-time multi-client code synchronization over WebSocket channels.
          </p>
        </div>
      </div>

      {/* User profile & logout bar */}
      <div className="pt-4 border-t border-[#30363d]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900/50 border border-blue-700/50 text-xs font-semibold text-blue-300">
              {user?.username ? user.username.charAt(0).toUpperCase() : <FiUser />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.username || 'Developer'}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#21262d] hover:text-red-400 transition-colors"
          >
            <FiLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

