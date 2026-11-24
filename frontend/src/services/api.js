import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL

export function getApiBaseUrl() {
  if (rawBaseUrl && rawBaseUrl !== 'undefined') {
    const formatted = rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`
    return formatted.endsWith('/api') ? formatted : `${formatted}/api`
  }

  // Automatic cloud fallback: when hosted on Render static CDN
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://codesync-backend-tk8m.onrender.com/api'
  }

  return '/api'
}

export const apiBaseUrl = getApiBaseUrl()

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ───────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  me: () => api.get('/auth/me'),
}

// ─── Room API ────────────────────────────────────────────────────────────────
export const roomAPI = {
  createRoom: (data) => api.post('/rooms', data),
  joinRoom: (accessCode) => api.post('/rooms/join', { accessCode }),
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  getMyRooms: () => api.get('/rooms/my'),
  getAllRooms: () => api.get('/rooms'),
  getStats: () => api.get('/rooms/stats'),
  updateRoom: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
  getParticipants: (roomId) => api.get(`/rooms/${roomId}/members`),
  changeParticipantRole: (roomId, userId, role) =>
    api.put(`/rooms/${roomId}/members/${userId}/role`, { role }),
  kickParticipant: (roomId, userId) =>
    api.delete(`/rooms/${roomId}/members/${userId}`),
}

// ─── Editor API ──────────────────────────────────────────────────────────────
export const editorAPI = {
  getContent: (roomId) => api.get(`/editor/${roomId}/content`),
  saveContent: (roomId, data) => api.post(`/editor/${roomId}/content`, data),
  getHistory: (roomId, params) => api.get(`/editor/${roomId}/history`, { params }),
  revertToRevision: (roomId, revision) =>
    api.post(`/editor/${roomId}/revert`, { revision }),
}

export default api
