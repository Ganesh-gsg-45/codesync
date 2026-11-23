import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { roomAPI } from '../services/api'
import Sidebar from '../components/dashboard/Sidebar'
import StatCard from '../components/dashboard/StatCard'
import LanguageDistribution from '../components/dashboard/LanguageDistribution'
import RoomCard from '../components/room/RoomCard'
import CreateRoomModal from '../components/room/CreateRoomModal'
import JoinRoomModal from '../components/room/JoinRoomModal'
import RoomSettingsModal from '../components/room/RoomSettingsModal'
import DeleteConfirmModal from '../components/room/DeleteConfirmModal'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'
import {
  FiPlus,
  FiLogIn,
  FiSearch,
  FiRefreshCw,
  FiCode,
  FiUsers,
  FiFolder,
  FiActivity,
  FiFilter,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  // State
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'my-rooms' | 'all-rooms'
  const [allRooms, setAllRooms] = useState([])
  const [myRooms, setMyRooms] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('ALL')
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'active' | 'name'

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [settingsRoom, setSettingsRoom] = useState(null)
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [myRes, allRes, statsRes] = await Promise.allSettled([
        roomAPI.getMyRooms(),
        roomAPI.getAllRooms(),
        roomAPI.getStats(),
      ])

      if (myRes.status === 'fulfilled') {
        setMyRooms(myRes.value.data || [])
      }
      if (allRes.status === 'fulfilled') {
        setAllRooms(allRes.value.data || [])
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data || null)
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err)
      toast.error('Failed to sync workspace data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteRoom = async (roomId) => {
    try {
      await roomAPI.deleteRoom(roomId)
      toast.success('Room successfully removed')
      fetchData(true)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete room')
    }
  }

  // Filtered and sorted rooms based on search, language, and sort
  const currentList = useMemo(() => {
    const source = activeTab === 'my-rooms' ? myRooms : allRooms
    const filtered = source.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.accessCode?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesLang =
        selectedLanguage === 'ALL' ||
        r.language?.toUpperCase() === selectedLanguage

      return matchesSearch && matchesLang
    })

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'active') {
        return (b.participantCount || 0) - (a.participantCount || 0)
      }
      // 'recent' by default
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB - dateA
    })
  }, [activeTab, myRooms, allRooms, searchQuery, selectedLanguage, sortBy])

  // Extract available languages from rooms
  const availableLanguages = useMemo(() => {
    const set = new Set()
    allRooms.forEach((r) => {
      if (r.language) set.add(r.language.toUpperCase())
    })
    return Array.from(set)
  }, [allRooms])

  return (
    <div className="flex min-h-[calc(100vh-56px)] bg-[#0d1117] text-gray-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
        user={user}
        onLogout={logout}
        onCreateRoom={() => setShowCreate(true)}
        onJoinRoom={() => setShowJoin(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#30363d]/70 pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Welcome back, {user?.username || 'Developer'}</span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Online
                </span>
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                CodeSync Real-Time Collaborative Workspace
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchData(true)}
                title="Refresh Workspace"
                className="gap-2"
                disabled={refreshing}
              >
                <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-400' : 'text-gray-400'}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowJoin(true)}
                className="gap-2"
              >
                <FiLogIn className="h-4 w-4 text-gray-400" />
                <span>Join Code</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreate(true)}
                className="gap-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>New Room</span>
              </Button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Workspace Statistics Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Rooms"
                  value={stats?.totalRooms ?? allRooms.length}
                  subtitle="Platform Workspaces"
                  icon={FiFolder}
                  color="blue"
                />
                <StatCard
                  title="My Workspaces"
                  value={stats?.myRoomsCount ?? myRooms.length}
                  subtitle="Rooms you own or joined"
                  icon={FiCode}
                  color="cyan"
                />
                <StatCard
                  title="Active Sessions"
                  value={stats?.activeRooms ?? allRooms.length}
                  subtitle="Real-time synchronized"
                  icon={FiActivity}
                  color="emerald"
                />
                <StatCard
                  title="Collaborators"
                  value={stats?.totalCollaborators ?? (allRooms.length > 0 ? allRooms.length * 2 : 1)}
                  subtitle="Total workspace seats"
                  icon={FiUsers}
                  color="purple"
                />
              </div>

              {/* Language Distribution Breakdown */}
              <LanguageDistribution distribution={stats?.languageDistribution || {}} />

              {/* Recent Rooms Strip */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-100">Recent Workspaces</h2>
                    <p className="text-xs text-gray-400">Jump right back into your active coding rooms</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('my-rooms')}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all my rooms →
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-44 rounded-xl border border-[#30363d] bg-[#161b22]/50 animate-pulse p-5" />
                    ))}
                  </div>
                ) : myRooms.length === 0 ? (
                  <EmptyState
                    title="No workspaces yet"
                    description="Create a room to start collaborative coding with your peers in real time."
                    actionText="Create Room"
                    onAction={() => setShowCreate(true)}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {myRooms.slice(0, 3).map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        currentUserId={user?.id}
                        onOpenSettings={(r) => setSettingsRoom(r)}
                        onRequestDelete={(r) => setDeleteRoomTarget(r)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2 & 3: ROOM LISTINGS (MY ROOMS / ALL ROOMS) */}
          {(activeTab === 'my-rooms' || activeTab === 'all-rooms') && (
            <div className="space-y-6">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, language or code..."
                    className="w-full rounded-xl bg-[#161b22] border border-[#30363d] pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <FiFilter className="h-4 w-4 text-gray-400" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="rounded-xl bg-[#161b22] border border-[#30363d] px-3 py-2 text-xs font-medium text-gray-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ALL">All Languages</option>
                      {availableLanguages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl bg-[#161b22] border border-[#30363d] px-3 py-2 text-xs font-medium text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="recent">Recently Created</option>
                    <option value="active">Most Active</option>
                    <option value="name">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Rooms Grid */}
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-44 rounded-xl border border-[#30363d] bg-[#161b22]/50 animate-pulse p-5" />
                  ))}
                </div>
              ) : currentList.length === 0 ? (
                <EmptyState
                  title={searchQuery ? 'No rooms match your search' : 'No rooms found'}
                  description={
                    searchQuery
                      ? `Try clearing your search query "${searchQuery}" or changing filters.`
                      : activeTab === 'my-rooms'
                      ? 'You have not created or joined any rooms yet.'
                      : 'No public rooms are active right now.'
                  }
                  actionText={searchQuery ? null : 'Create Room'}
                  onAction={() => setShowCreate(true)}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {currentList.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      currentUserId={user?.id}
                      onOpenSettings={(r) => setSettingsRoom(r)}
                      onRequestDelete={(r) => setDeleteRoomTarget(r)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECENT ACTIVITY */}
          {activeTab === 'recent-activity' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Activity & Workspaces</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Chronological collaboration log and recently updated active rooms across the platform.
                </p>
              </div>

              {allRooms.length === 0 ? (
                <EmptyState
                  title="No activity recorded yet"
                  description="Create or join a room to generate collaborative activity events."
                  actionText="Create Room"
                  onAction={() => setShowCreate(true)}
                />
              ) : (
                <div className="space-y-3">
                  {allRooms.map((room) => {
                    const owner = room.members?.find((m) => m.role === 'OWNER')
                    const dateFormatted = room.createdAt
                      ? new Date(room.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently'

                    return (
                      <div
                        key={room.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#30363d] bg-[#161b22]/70 p-4 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold flex-shrink-0">
                            {room.language ? room.language.substring(0, 2).toUpperCase() : 'CD'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-100 text-sm">{room.name}</h3>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-blue-400 border border-[#30363d]">
                                {room.accessCode}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Created by{' '}
                              <span className="text-gray-300 font-medium">
                                {owner?.username || 'Host'}
                              </span>{' '}
                              • {dateFormatted}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            {room.participantCount ?? 1} participant(s)
                          </span>
                          <button
                            onClick={() => window.location.assign(`/room/${room.id}`)}
                            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                          >
                            Launch IDE
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={() => fetchData(true)}
        />
      )}
      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
        />
      )}
      {settingsRoom && (
        <RoomSettingsModal
          room={settingsRoom}
          currentUserId={user?.id}
          onClose={() => setSettingsRoom(null)}
          onUpdated={() => fetchData(true)}
        />
      )}
      {deleteRoomTarget && (
        <DeleteConfirmModal
          room={deleteRoomTarget}
          onClose={() => setDeleteRoomTarget(null)}
          onConfirm={handleDeleteRoom}
        />
      )}
    </div>
  )
}
