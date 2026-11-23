import Badge from '../common/Badge'
import { FiUser } from 'react-icons/fi'

const ROLE_VARIANT = {
  OWNER: 'warning',
  EDITOR: 'info',
  VIEWER: 'default',
}

function Avatar({ username, color }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ backgroundColor: color || '#3b82f6' }}
    >
      {username ? username[0].toUpperCase() : <FiUser className="w-4 h-4" />}
    </div>
  )
}

export default function ParticipantList({ participants = [], cursors = {}, currentUserId }) {
  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-[#6e7681] uppercase tracking-wider mb-3 px-1">
        Participants ({participants.length})
      </h3>
      <ul className="space-y-1">
        {participants.map((p) => {
          const isCurrentUser = p.userId === currentUserId
          const cursor = cursors[p.userId]
          return (
            <li
              key={p.userId}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors ${
                isCurrentUser ? 'bg-brand-500/10' : 'hover:bg-[#21262d]'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar username={p.username} color={p.color} />
                {/* Online dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#161b22]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-[#e6edf3] truncate">
                    {p.username}
                    {isCurrentUser && (
                      <span className="text-[#6e7681] text-xs"> (you)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge
                    variant={ROLE_VARIANT[p.role] || 'default'}
                    text={p.role || 'VIEWER'}
                    small
                  />
                  {cursor && !isCurrentUser && (
                    <span className="text-[10px] font-mono text-[#6e7681]">
                      {cursor.line}:{cursor.column}
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
        {participants.length === 0 && (
          <li className="text-xs text-[#6e7681] px-2 py-3 text-center">
            No participants yet
          </li>
        )}
      </ul>
    </div>
  )
}
