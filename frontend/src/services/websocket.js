import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

class WebSocketService {
  constructor() {
    this.client = null
    this.subscriptions = []
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect(token, roomId, callbacks = {}, user = null) {
    const {
      onOperation,
      onPresence,
      onCursor,
      onSync,
      onConnected,
      onDisconnected,
      onError,
    } = callbacks

    // Auto-detect base URL for SockJS (supports custom VITE_WS_URL or relative /ws)
    const wsUrl = import.meta.env.VITE_WS_URL || '/ws'

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        userId: user?.id || token || '',
        username: user?.username || '',
        token: token || user?.id || '',
      },
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 3000,

      onConnect: () => {
        this.connected = true
        this.reconnectAttempts = 0

        // 1. Subscribe to room operations & sync
        const sub1 = this.client.subscribe(
          `/topic/room/${roomId}`,
          (message) => {
            try {
              const payload = JSON.parse(message.body)
              if (payload.type === 'OPERATION' && onOperation) onOperation(payload)
              if (payload.type === 'SYNC' && onSync) onSync(payload)
            } catch (err) {
              console.error('Error parsing room message:', err)
            }
          }
        )

        // 2. Subscribe to presence (join/leave/participants)
        const sub2 = this.client.subscribe(
          `/topic/room/${roomId}/presence`,
          (message) => {
            try {
              const payload = JSON.parse(message.body)
              if (onPresence) onPresence(payload)
            } catch (err) {
              console.error('Error parsing presence message:', err)
            }
          }
        )

        // 3. Subscribe to cursor updates
        const sub3 = this.client.subscribe(
          `/topic/room/${roomId}/cursors`,
          (message) => {
            try {
              const payload = JSON.parse(message.body)
              if (onCursor) onCursor(payload)
            } catch (err) {
              console.error('Error parsing cursor message:', err)
            }
          }
        )

        // 4. Subscribe to private reply queue
        const sub4 = this.client.subscribe(
          `/user/queue/reply`,
          (message) => {
            try {
              const payload = JSON.parse(message.body)
              if (payload.type === 'SYNC' && onSync) onSync(payload)
            } catch (err) {
              console.error('Error parsing reply message:', err)
            }
          }
        )

        this.subscriptions = [sub1, sub2, sub3, sub4]
        if (onConnected) onConnected()
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame)
        if (onError) onError(frame)
      },

      onDisconnect: () => {
        this.connected = false
        if (onDisconnected) onDisconnected()
      },

      onWebSocketError: (error) => {
        console.error('WebSocket error:', error)
        if (onError) onError(error)
      },
    })

    this.client.activate()
  }

  sendOperation(operation) {
    if (!this.connected || !this.client) return
    this.client.publish({
      destination: '/app/editor.operation',
      body: JSON.stringify(operation),
    })
  }

  sendCursor(cursorData) {
    if (!this.connected || !this.client) return
    this.client.publish({
      destination: '/app/editor.cursor',
      body: JSON.stringify(cursorData),
    })
  }

  join(roomId, userId) {
    if (!this.connected || !this.client) return
    this.client.publish({
      destination: '/app/editor.join',
      body: JSON.stringify({ roomId, userId }),
    })
  }

  leave(roomId, userId) {
    if (!this.connected || !this.client) return
    this.client.publish({
      destination: '/app/editor.leave',
      body: JSON.stringify({ roomId, userId }),
    })
  }

  sync(roomId) {
    if (!this.connected || !this.client) return
    this.client.publish({
      destination: '/app/editor.sync',
      body: JSON.stringify({ roomId }),
    })
  }

  disconnect() {
    this.subscriptions.forEach((sub) => {
      try { sub.unsubscribe() } catch (_) {}
    })
    this.subscriptions = []
    if (this.client) {
      this.client.deactivate()
      this.client = null
    }
    this.connected = false
  }

  isConnected() {
    return this.connected
  }
}

// Singleton export
const websocketService = new WebSocketService()
export default websocketService
