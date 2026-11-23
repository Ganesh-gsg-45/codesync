import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import {
  FiMail,
  FiLock,
  FiCode,
  FiEye,
  FiEyeOff,
  FiZap,
  FiActivity,
  FiCheckCircle,
  FiShield,
  FiUsers,
  FiArrowRight,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const e = {}
    if (!form.email.trim()) {
      e.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Please enter a valid email address'
    }
    if (!form.password) {
      e.password = 'Password is required'
    }
    return e
  }

  async function handleSubmit(evt) {
    evt.preventDefault()
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await login(form.email.trim(), form.password)
      toast.success('Welcome back to CodeSync!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      let msg = ''
      if (!err?.response) {
        msg = 'Connection Error: Unable to reach backend server at http://localhost:8080. Please verify Spring Boot is running.'
      } else if (err.response.status === 401) {
        msg = 'Authentication Error: Invalid email or password. Please verify your credentials or register.'
      } else if (err.response.status === 400) {
        msg = err.response.data?.message || 'Validation Error: Please provide both email and password.'
      } else {
        msg = err.response.data?.message || `Login failed (HTTP ${err.response.status}).`
      }
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: undefined, form: undefined }))
  }

  const handleQuickFill = (email, pwd) => {
    setForm({ email, password: pwd })
    setErrors({})
    toast.success(`Loaded credentials for ${email}`)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-[#0a0e17] text-gray-100">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Interactive Platform Showcase */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between space-y-8 pr-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Real-Time Code Collaboration Engine</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Code together in <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">real time</span> with zero conflict.
            </h1>

            <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-lg">
              CodeSync pairs Spring Boot 3 WebSocket STOMP messaging with Monaco Editor and Operational Transformation (OT) for simultaneous developer synchronization.
            </p>
          </div>

          {/* Simulated Interactive IDE Preview Card */}
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22]/90 shadow-2xl shadow-blue-950/30 overflow-hidden backdrop-blur-md">
            {/* Window Topbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-gray-400">CollaborationEngine.js</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SYNC LIVE</span>
              </div>
            </div>

            {/* Code Body with Simulated Multi-Cursor Presence */}
            <div className="p-4 font-mono text-xs text-gray-300 space-y-1 bg-[#0d1117]/80">
              <div className="text-gray-500">// Real-time collaborative buffer synchronization</div>
              <div><span className="text-purple-400">import</span> &#123; <span className="text-blue-300">OperationalTransform</span> &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">'@codesync/ot'</span>;</div>
              <div className="text-gray-500">// Active session with live STOMP WebSocket channels</div>
              <div><span className="text-blue-400">const</span> session = <span className="text-purple-400">await</span> CodeSync.<span className="text-yellow-300">joinRoom</span>(<span className="text-emerald-300">"CS-ROOM"</span>);</div>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-gray-400">05</span>
                <span className="text-blue-400">session</span>.<span className="text-yellow-300">broadcastOperation</span>(&#123;
                {/* Simulated Cursor 1 */}
                <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.2 text-[10px] text-white font-sans font-medium shadow-sm animate-pulse">
                  Ganesh (editing)
                </span>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="text-gray-400">06</span>
                <span>revision: <span className="text-orange-400">42</span>,</span>
                {/* Simulated Cursor 2 */}
                <span className="inline-flex items-center gap-1 rounded bg-cyan-600 px-1.5 py-0.2 text-[10px] text-white font-sans font-medium shadow-sm">
                  Peer Collaborator
                </span>
              </div>
              <div className="pl-4"><span className="text-gray-400">07</span> <span>checksum: <span className="text-emerald-300">"0x9A2F"</span></span></div>
              <div><span className="text-gray-400">08</span> &#125;);</div>
            </div>

            {/* Feature Badges Footer */}
            <div className="grid grid-cols-3 divide-x divide-[#30363d] bg-[#161b22] px-4 py-2.5 text-xs text-gray-400">
              <div className="flex items-center gap-1.5 justify-center">
                <FiZap className="h-3.5 w-3.5 text-amber-400" />
                <span>&lt;15ms Latency</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <FiShield className="h-3.5 w-3.5 text-blue-400" />
                <span>BCrypt + JWT</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <FiActivity className="h-3.5 w-3.5 text-emerald-400" />
                <span>Zero Divergence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="lg:col-span-5 w-full">
          <div className="relative rounded-2xl border border-[#30363d] bg-[#161b22]/90 p-8 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
            {/* Top Glow Accent */}
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
                <FiCode className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Sign In to CodeSync</h2>
                <p className="text-xs text-gray-400">Enter your credentials to access workspaces</p>
              </div>
            </div>

            {errors.form && (
              <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/25 p-3.5 text-xs text-red-300 leading-relaxed flex items-start gap-2.5">
                <div className="h-4 w-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                <div>{errors.form}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="ganesh630926@gmail.com"
                    autoComplete="email"
                    className={`w-full rounded-xl bg-[#0d1117] border ${
                      errors.email ? 'border-red-500 focus:ring-red-500' : 'border-[#30363d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className={`w-full rounded-xl bg-[#0d1117] border ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : 'border-[#30363d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } pl-10 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="w-full mt-2 py-3 text-sm font-semibold shadow-lg shadow-blue-600/30 gap-2"
              >
                <span>Sign In to CodeSync</span>
                <FiArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Quick Fill Demo Helper */}
            <div className="mt-6 pt-5 border-t border-[#30363d]/60">
              <p className="text-xs text-gray-400 text-center mb-2">
                Quick autofill test accounts (password: <code className="text-emerald-400 font-mono">Password123!</code>):
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleQuickFill('ganesh630926@gmail.com', 'Password123!')}
                  className="rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-3 py-1.5 text-xs font-mono text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  ganesh630926@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('alex@codesync.dev', 'Password123!')}
                  className="rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-3 py-1.5 text-xs font-mono text-gray-300 hover:text-white transition-colors"
                >
                  alex@codesync.dev
                </button>
              </div>
            </div>

            {/* Switch to Register */}
            <p className="mt-6 text-center text-xs text-gray-400">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
