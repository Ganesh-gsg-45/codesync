import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { roomAPI } from '../../services/api'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import { FiCode, FiLock, FiUnlock, FiUsers, FiAlignLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { value: 'JAVASCRIPT', label: 'JavaScript' },
  { value: 'TYPESCRIPT', label: 'TypeScript' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'JAVA', label: 'Java' },
  { value: 'CPP', label: 'C++' },
  { value: 'GO', label: 'Go' },
  { value: 'RUST', label: 'Rust' },
  { value: 'HTML', label: 'HTML/CSS' },
]

export default function CreateRoomModal({ onClose, onCreated }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('JAVASCRIPT')
  const [isPrivate, setIsPrivate] = useState(true)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs = {}
    if (!name.trim()) {
      errs.name = 'Room name is required'
    } else if (name.trim().length < 3) {
      errs.name = 'Room name must be at least 3 characters'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const res = await roomAPI.createRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        language: language.toUpperCase(),
        isPrivate,
        maxParticipants: Number(maxParticipants),
        creatorUserId: user?.id,
      })
      toast.success(`Room "${res.data.name}" created successfully!`)
      onCreated?.()
      onClose()
      navigate(`/room/${res.data.id}`)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create room'
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Create New Collaborative Room" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {errors.form}
          </div>
        )}

        <Input
          label="Room Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setErrors(prev => ({ ...prev, name: undefined }))
          }}
          placeholder="e.g. Distributed Consensus Engine"
          error={errors.name}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
            <FiAlignLeft className="h-3.5 w-3.5 text-gray-400" />
            <span>Description (Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you collaborating on?"
            rows={2}
            className="w-full rounded-lg bg-[#0d1117] border border-[#30363d] px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <FiCode className="h-3.5 w-3.5 text-gray-400" />
              <span>Language</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg bg-[#0d1117] border border-[#30363d] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <FiUsers className="h-3.5 w-3.5 text-gray-400" />
              <span>Max Collaborators</span>
            </label>
            <select
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full rounded-lg bg-[#0d1117] border border-[#30363d] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value={2}>2 Participants (Pair)</option>
              <option value={5}>5 Participants (Small Team)</option>
              <option value={10}>10 Participants (Standard)</option>
              <option value={25}>25 Participants (Classroom)</option>
            </select>
          </div>
        </div>

        {/* Room Privacy Toggle */}
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isPrivate ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {isPrivate ? <FiLock className="h-4 w-4" /> : <FiUnlock className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">
                {isPrivate ? 'Private Room' : 'Public Room'}
              </p>
              <p className="text-xs text-gray-400">
                {isPrivate ? 'Requires a 6-character access code to join' : 'Anyone can discover and join this room'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPrivate ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isPrivate ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30363d]">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  )
}
