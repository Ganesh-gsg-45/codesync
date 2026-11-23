import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // On mount, validate token and load current user
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const response = await authAPI.me()
        setUser(response.data)
        setToken(storedToken)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await authAPI.login({ email, password })
    const { accessToken, user: userData } = response.data
    localStorage.setItem('token', accessToken)
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken)
    }
    setToken(accessToken)
    setUser(userData)
    return response.data
  }, [])

  const register = useCallback(async (username, email, password) => {
    const response = await authAPI.register({ username, email, password })
    const { accessToken, user: userData } = response.data
    localStorage.setItem('token', accessToken)
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken)
    }
    setToken(accessToken)
    setUser(userData)
    return response.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken')
    if (!storedRefreshToken) throw new Error('No refresh token')
    const response = await authAPI.refresh({ refreshToken: storedRefreshToken })
    const { accessToken } = response.data
    localStorage.setItem('token', accessToken)
    setToken(accessToken)
    return accessToken
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
