import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import Badge from '../common/Badge'
import { roomAPI } from '../../services/api'
import { FiCopy, FiCheck, FiUsers, FiTrash2, FiShield, FiEdit3 } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function RoomSettingsModal({ room, currentUserId, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('general') // 'general' | 'members'
  const [name, setName] = useState(room.name || '')
  const [description, setDescription] = useState(room.description || '')
  const [language, setLanguage] = useState(room.language || 'JAVASCRIPT')
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [saving, setSaving] = useState(false)

  // Determine if the current user is owner
  const isOwner = Boolean(
    (room.createdBy && (room.createdBy === currentUserId || room.createdBy?.id === currentUserId)) ||
    room.members?.some(m => (m.userId === currentUserId || m.user?.id === currentUserId) && m.role === 'OWNER')
  )

  useEffect(() => {
    if (activeTab === 'members') {
      setLoadingMembers(true)
      roomAPI.getParticipants(room.id)
        .then(res => setMembers(res.data || []))
        .catch(err => {
          console.error(err)
          toast.error('Failed to load participants')
        })
        .finally(() => setLoadingMembers(false))
    }
  }, [activeTab, room.id])

  const handleCopyCode = () => {
    if (!room.accessCode) return
    navigator.clipboard.writeText(room.accessCode)
    setCopied(true)
    toast.success(`Copied access code: ${room.accessCode}`)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveGeneral = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await roomAPI.updateRoom(room.id, {
        name: name.trim(),
        description: description.trim(),
        language: language.toUpperCase(),
      })
      toast.success('Room settings updated')
      onUpdated?.()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update room')
    } finally {
      setSaving(false)
    }
  }

  const handleChangeRole = async (memberUserId, newRole) => {
    try {
      await roomAPI.changeParticipantRole(room.id, memberUserId, newRole)
      setMembers(prev => prev.map(m => m.userId === memberUserId ? { ...m, role: newRole } : m))
      toast.success('Role updated successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change role')
    }
  }

  const handleKickMember = async (memberUserId) => {
    try {
      await roomAPI.kickParticipant(room.id, memberUserId)
      setMembers(prev => prev.filter(m => m.userId !== memberUserId))
      toast.success('Member removed from room')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove member')
    }
  }

  return (
    <Modal title={`Room Settings – ${room.name}`} onClose={onClose}>
      <div className="space-y-5">
        {/* Navigation tabs */}
        <div className="flex border-b border-[#30363d]">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FiEdit3 className="h-4 w-4" />
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FiUsers className="h-4 w-4" />
            Members ({room.participantCount ?? members.length})
          </button>
        </div>

        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            {!isOwner && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-300 flex items-center gap-2">
                <FiShield className="h-4 w-4 shrink-0" />
                <span>Read-only view. Only the room host (OWNER) can modify room configuration or manage member roles.</span>
              </div>
            )}

            {/* Access Code display */}
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Room Access Code</p>
                <p className="font-mono text-lg font-bold tracking-widest text-blue-400">{room.accessCode}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyCode}
                className="gap-2 text-xs"
              >
                {copied ? <FiCheck className="h-4 w-4 text-emerald-400" /> : <FiCopy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Code'}
              </Button>
            </div>

            <Input
              label="Room Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Room Name"
              disabled={!isOwner}
              required
            />

            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this coding room"
                rows={2}
                disabled={!isOwner}
                className={`w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-gray-100 placeholder-gray-500 text-sm focus:outline-none ${!isOwner ? 'opacity-60 cursor-not-allowed' : 'focus:border-blue-500'}`}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={!isOwner}
                className={`w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-gray-100 text-sm focus:outline-none ${!isOwner ? 'opacity-60 cursor-not-allowed' : 'focus:border-blue-500'}`}
              >
                {['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO', 'RUST'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#30363d]">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                {isOwner ? 'Cancel' : 'Close'}
              </Button>
              {isOwner && (
                <Button type="submit" variant="primary" size="sm" loading={saving}>
                  Save Changes
                </Button>
              )}
            </div>
          </form>
        )}

        {activeTab === 'members' && (
          <div className="space-y-3">
            {loadingMembers ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading participants...</div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No participants loaded.</div>
            ) : (
              <div className="divide-y divide-[#30363d]/60 rounded-xl border border-[#30363d] bg-[#0d1117]">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/50 border border-blue-700/50 text-xs font-semibold text-blue-300">
                        {member.username ? member.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{member.username}</p>
                        <p className="text-[11px] text-gray-400">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner && member.role !== 'OWNER' && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.userId, e.target.value)}
                            className="rounded bg-[#161b22] border border-[#30363d] text-xs text-gray-300 px-2 py-1 focus:outline-none focus:border-blue-500"
                          >
                            <option value="EDITOR">EDITOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleKickMember(member.userId)}
                            title="Remove member"
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {member.role === 'OWNER' && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                          <FiShield className="h-3 w-3" /> Host
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

