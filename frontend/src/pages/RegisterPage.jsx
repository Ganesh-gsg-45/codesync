import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import {
  FiUser,
  FiMail,
  FiLock,
  FiCode,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiZap,
  FiShield,
  FiUsers,
  FiArrowRight,
  FiCpu,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Interactive password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = form.password
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-700' }
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-red-500' }
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' }
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' }
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' }
  }, [form.password])

  function validate() {
    const e = {}
    const trimmedUsername = form.username.trim()
    if (!trimmedUsername) {
      e.username = 'Username is required'
    } else if (trimmedUsername.length < 3) {
      e.username = 'Username must be at least 3 characters'
    } else if (trimmedUsername.length > 50) {
      e.username = 'Username cannot exceed 50 characters'
    }

    const trimmedEmail = form.email.trim()
    if (!trimmedEmail) {
      e.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      e.email = 'Please enter a valid email format'
    }

    if (!form.password) {
      e.password = 'Password is required'
    } else if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters'
    }

    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
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
      await register(form.username.trim(), form.email.trim(), form.password)
      toast.success('Account created! Welcome to CodeSync 🚀')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Registration error:', err)
      let msg = ''
      if (!err?.response) {
        msg = 'Connection Error: Unable to reach backend server. Please verify your internet connection or backend status.'
      } else if (err.response.status === 409) {
        msg = err.response.data?.message || 'Conflict: This username or email is already registered.'
      } else if (err.response.status === 400) {
        if (err.response.data?.errors) {
          const firstErr = Object.values(err.response.data.errors)[0]
          msg = firstErr || err.response.data?.message || 'Validation Error: Please verify submitted registration details.'
        } else {
          msg = err.response.data?.message || 'Validation Error: Please check form field requirements.'
        }
      } else {
        msg = err.response.data?.message || `Registration failed (HTTP ${err.response.status}).`
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

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-[#0a0e17] text-gray-100">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Product Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Final-Year B.Tech AI & ML Architecture</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Create your <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">developer account</span> today.
            </h1>

            <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-md">
              Join CodeSync to start collaborative live sessions, code with peers across distributed clients, and experience real-time Operational Transformation.
            </p>
          </div>

          {/* Interactive Feature Grid */}
          <div className="space-y-3.5">
            <div className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-3.5 flex items-start gap-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
                <FiZap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">Real-Time STOMP WebSockets</p>
                <p className="text-xs text-gray-400 mt-0.5">Sub-15ms message broadcasting for simultaneous typing across multi-client rooms.</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-3.5 flex items-start gap-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">
                <FiCpu className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">Operational Transformation (OT)</p>
                <p className="text-xs text-gray-400 mt-0.5">Revision-aware operational deltas preventing race conditions and document divergence.</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#30363d] bg-[#161b22]/70 p-3.5 flex items-start gap-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                <FiShield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">Security & Persistent Storage</p>
                <p className="text-xs text-gray-400 mt-0.5">BCrypt-hashed passwords, HMAC-SHA256 JWT tokens, and persistent database storage.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Card */}
        <div className="lg:col-span-6 w-full">
          <div className="relative rounded-2xl border border-[#30363d] bg-[#161b22]/90 p-8 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
            {/* Top Glow Accent */}
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
                <FiCode className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Create your account</h2>
                <p className="text-xs text-gray-400">Get instant access to real-time coding rooms</p>
              </div>
            </div>

            {errors.form && (
              <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/25 p-3.5 text-xs text-red-300 leading-relaxed flex items-start gap-2.5">
                <div className="h-4 w-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                <div>{errors.form}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="e.g. ganesh630926"
                    className={`w-full rounded-xl bg-[#0d1117] border ${
                      errors.username ? 'border-red-500 focus:ring-red-500' : 'border-[#30363d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all`}
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
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
                    className={`w-full rounded-xl bg-[#0d1117] border ${
                      errors.email ? 'border-red-500 focus:ring-red-500' : 'border-[#30363d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className={`w-full rounded-xl bg-[#0d1117] border ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : 'border-[#30363d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } pl-10 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors p-1"
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Live Password Strength Meter */}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Strength</span>
                      <span className="font-semibold text-gray-300">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0d1117] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`w-full rounded-xl bg-[#0d1117] border ${
                      errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-[#30363d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all`}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="w-full mt-4 py-3 text-sm font-semibold shadow-lg shadow-blue-600/30 gap-2"
              >
                <span>Create Developer Account</span>
                <FiArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
