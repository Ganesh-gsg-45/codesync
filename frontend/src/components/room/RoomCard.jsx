import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '../common/Badge'
import {
  FiUsers,
  FiCode,
  FiLock,
  FiUnlock,
  FiArrowRight,
  FiCopy,
  FiCheck,
  FiSettings,
  FiTrash2,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const LANG_CONFIG = {
  JAVASCRIPT: { variant: 'warning', label: 'JS' },
  TYPESCRIPT: { variant: 'info', label: 'TS' },
  PYTHON: { variant: 'success', label: 'PY' },
  JAVA: { variant: 'danger', label: 'JAVA' },
  CPP: { variant: 'default', label: 'C++' },
  GO: { variant: 'info', label: 'GO' },
  RUST: { variant: 'warning', label: 'RS' },
  HTML: { variant: 'danger', label: 'HTML' },
  DEFAULT: { variant: 'default', label: 'CODE' },
}

export default function RoomCard({
  room,
  currentUserId,
  onOpenSettings,
  onRequestDelete,
}) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const langKey = room.language ? room.language.toUpperCase() : 'DEFAULT'
  const langConf = LANG_CONFIG[langKey] || LANG_CONFIG.DEFAULT

  const ownerMember = room.members?.find(m => m.role === 'OWNER')
  const isOwner = ownerMember?.userId === currentUserId || room.members?.some(m => m.userId === currentUserId && m.role === 'OWNER')

  const handleCopyCode = (e) => {
    e.stopPropagation()
    if (!room.accessCode) return
    navigator.clipboard.writeText(room.accessCode)
    setCopied(true)
    toast.success(`Copied access code: ${room.accessCode}`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-[#30363d] bg-[#161b22]/70 p-5 transition-all duration-200 hover:border-blue-500/40 hover:bg-[#161b22] hover:shadow-lg hover:shadow-blue-950/20 backdrop-blur-sm">
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-100 truncate text-base group-hover:text-blue-400 transition-colors">
                {room.name}
              </h3>
              {isOwner && (
                <span className="inline-flex items-center rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 flex-shrink-0">
                  Owner
                </span>
              )}
            </div>
            {room.description && (
              <p className="mt-1 text-xs text-gray-400 line-clamp-1">{room.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={langConf.variant} text={room.language || 'JAVASCRIPT'} small />
            {room.isPrivate ? (
              <span
                className="inline-flex items-center gap-1 rounded bg-[#21262d] px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-400/20"
                title="Private Room - Requires Access Code"
              >
                <FiLock className="h-2.5 w-2.5" />
                Private
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded bg-[#21262d] px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-400/20"
                title="Public Room"
              >
                <FiUnlock className="h-2.5 w-2.5" />
                Public
              </span>
            )}
          </div>
        </div>

        {/* Access Code Pill */}
        {room.accessCode && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-[#0d1117] border border-[#30363d]/60 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-gray-300">
              <span className="text-gray-500 text-[11px]">CODE:</span>
              <span className="font-semibold tracking-wider text-blue-400">{room.accessCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              title="Copy code to share with collaborators"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-300 transition-colors"
            >
              {copied ? <FiCheck className="h-3.5 w-3.5 text-emerald-400" /> : <FiCopy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Info & Actions */}
      <div className="mt-5 pt-4 border-t border-[#30363d]/60">
        <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <FiUsers className="h-3.5 w-3.5 text-gray-400" />
            <span>{room.participantCount ?? 1} / {room.maxParticipants ?? 10} members</span>
          </span>
          <span className="text-[11px] text-gray-500">
            {ownerMember?.username ? `Host: ${ownerMember.username}` : (room.active !== false ? 'Live Workspace' : 'Archived')}
          </span>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/room/${room.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600/15 border border-blue-500/30 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-150"
          >
            <span>Open Room</span>
            <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {onOpenSettings && (
            <button
              onClick={() => onOpenSettings(room)}
              title="Room Settings & Members"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#30363d] bg-[#21262d] text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
            >
              <FiSettings className="h-3.5 w-3.5" />
            </button>
          )}

          {onRequestDelete && (
            <button
              onClick={() => onRequestDelete(room)}
              title="Delete Room"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#30363d] bg-[#21262d] text-gray-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
