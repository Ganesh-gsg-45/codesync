import React, { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { FiAlertTriangle } from 'react-icons/fi'

export default function DeleteConfirmModal({ room, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm(room.id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Delete Room" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-300">
          <FiAlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">Are you sure?</p>
            <p className="mt-1 text-xs text-red-300/80">
              This will deactivate and remove the room <strong className="text-white">"{room?.name}"</strong> and its shared session. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} loading={loading}>
            Delete Room
          </Button>
        </div>
      </div>
    </Modal>
  )
}

