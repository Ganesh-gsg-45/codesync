import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import { FiCode, FiLogOut, FiUser } from 'react-icons/fi'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#30363d] bg-[#0d1117]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <FiCode className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Code<span className="text-blue-500">Sync</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-[#161b22]"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-[#30363d]">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/50 border border-blue-700/50 text-xs font-semibold text-blue-300">
                    {user.username ? user.username.charAt(0).toUpperCase() : <FiUser />}
                  </div>
                  <span className="font-medium hidden sm:inline">{user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  title="Sign out"
                  className="text-gray-400 hover:text-rose-400"
                >
                  <FiLogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
