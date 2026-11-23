import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useEditor } from '../context/EditorContext'
import websocketService from '../services/websocket'
import toast from 'react-hot-toast'

// Assign deterministic color from userId
const USER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]
function colorForUser(userId) {
  if (!userId) return USER_COLORS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

export function useWebSocket(roomId) {
  const { token, user } = useAuth()
  const {
    updateContent,
    addParticipant,
    removeParticipant,
    updateCursor,
    setConnected,
    setParticipants,
    setVersion,
  } = useEditor()

  const [connected, setLocalConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)

  const handleOperation = useCallback((payload) => {
    if (!payload) return
    // Ignore echoing our own operations
    if (payload.userId && user?.id && payload.userId === user.id) {
      if (payload.revision != null) setVersion(payload.revision)
      return
    }

    if (payload.content != null) {
      updateContent(payload.content)
    }
    if (payload.revision != null) {
      setVersion(payload.revision)
    }
  }, [updateContent, setVersion, user?.id])

  const handlePresence = useCallback((payload) => {
    if (payload.type === 'JOIN') {
      if (payload.participants && payload.participants.length > 0) {
        const list = payload.participants.map(p => ({
          ...p,
          color: colorForUser(p.userId || p.username),
        }))
        setParticipants(list)
      } else {
        addParticipant({
          userId: payload.userId,
          username: payload.username,
          role: payload.role,
          color: colorForUser(payload.userId),
        })
      }
      if (payload.userId !== user?.id) {
        toast(`${payload.username} joined the room`, { icon: '👋' })
      }
    } else if (payload.type === 'LEAVE') {
      if (payload.participants) {
        const list = payload.participants.map(p => ({
          ...p,
          color: colorForUser(p.userId || p.username),
        }))
        setParticipants(list)
      } else {
        removeParticipant(payload.userId)
      }
      if (payload.userId !== user?.id) {
        toast(`${payload.username} left the room`, { icon: '🚪' })
      }
    } else if (payload.type === 'PARTICIPANTS') {
      const list = (payload.participants || []).map(p => ({
        ...p,
        color: colorForUser(p.userId),
      }))
      setParticipants(list)
    }
  }, [addParticipant, removeParticipant, setParticipants, user?.id])

  const handleCursor = useCallback((payload) => {
    if (!payload?.userId || payload.userId === user?.id) return
    updateCursor({
      userId: payload.userId,
      username: payload.username,
      line: payload.line,
      column: payload.column,
      color: colorForUser(payload.userId),
    })
  }, [updateCursor, user?.id])

  const handleSync = useCallback((payload) => {
    if (payload.content != null) {
      updateContent(payload.content)
    }
    if (payload.revision != null) setVersion(payload.revision)
    if (payload.participants && payload.participants.length > 0) {
      const list = payload.participants.map(p => ({
        ...p,
        color: colorForUser(p.userId || p.username),
      }))
      setParticipants(list)
    }
  }, [updateContent, setVersion, setParticipants])

  useEffect(() => {
    if (!roomId) return

    const effectiveToken = token || user?.id || 'guest-token'

    websocketService.connect(effectiveToken, roomId, {
      onConnected: () => {
        setLocalConnected(true)
        setConnected(true)
        setReconnecting(false)
        if (user?.id) {
          websocketService.join(roomId, user.id)
        }
        websocketService.sync(roomId)
      },
      onDisconnected: () => {
        setLocalConnected(false)
        setConnected(false)
        setReconnecting(true)
      },
      onOperation: handleOperation,
      onPresence: handlePresence,
      onCursor: handleCursor,
      onSync: handleSync,
      onError: (err) => {
        console.error('WebSocket error:', err)
        setLocalConnected(false)
        setConnected(false)
      },
    }, user)

    return () => {
      if (user?.id) {
        websocketService.leave(roomId, user.id)
      }
      websocketService.disconnect()
      setConnected(false)
    }
  }, [roomId, token, user?.id, handleOperation, handlePresence, handleCursor, handleSync, setConnected])

  const sendOperation = useCallback((op) => {
    if (!websocketService.isConnected()) return
    websocketService.sendOperation({
      type: 'OPERATION',
      roomId,
      userId: user?.id,
      username: user?.username || 'Collaborator',
      content: op.content,
      revision: op.revision ?? 0,
      timestamp: new Date().toISOString(),
    })
  }, [roomId, user?.id, user?.username])

  const sendCursor = useCallback((cursorData) => {
    if (!websocketService.isConnected()) return
    websocketService.sendCursor({
      type: 'CURSOR',
      roomId,
      userId: user?.id,
      username: user?.username || 'Collaborator',
      line: cursorData.line,
      column: cursorData.column,
    })
  }, [roomId, user?.id, user?.username])

  const resync = useCallback(() => {
    if (websocketService.isConnected()) {
      websocketService.sync(roomId)
    }
  }, [roomId])

  return { connected, reconnecting, sendOperation, sendCursor, resync }
}
