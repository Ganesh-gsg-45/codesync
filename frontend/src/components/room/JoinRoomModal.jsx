import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomAPI } from '../../services/api'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { FiKey, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function JoinRoomModal({ onClose }) {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
    setError('')
  }

  async function handleSubmit(evt) {
    evt.preventDefault()
    if (!accessCode || accessCode.length !== 6) {
      setError('Please enter the complete 6-character access code')
      return
    }

    setLoading(true)
    try {
      const res = await roomAPI.joinRoom(accessCode)
      toast.success(`Joined "${res.data.name}" successfully!`)
      onClose()
      navigate(`/room/${res.data.id}`)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid or expired access code'
      toast.error(msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Join Collaborative Room" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <FiKey className="h-6 w-6" />
          </div>
          <p className="text-sm text-gray-300">
            Enter the 6-character room access code shared by the room host.
          </p>
        </div>

        <div>
          <input
            type="text"
            value={accessCode}
            onChange={handleChange}
            placeholder="XXXXXX"
            maxLength={6}
            autoFocus
            className={`w-full text-center tracking-[0.7em] text-2xl font-mono py-3.5 px-4 rounded-xl bg-[#0d1117] border ${
              error ? 'border-red-500 ring-1 ring-red-500' : 'border-[#30363d] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } text-blue-400 placeholder-gray-600 font-bold focus:outline-none transition-all uppercase`}
          />
          {error && <p className="mt-2 text-xs text-red-400 text-center">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={accessCode.length !== 6}
            className="flex-1 gap-2"
          >
            <span>Join Room</span>
            <FiArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Modal>
  )
}
