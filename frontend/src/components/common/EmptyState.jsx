import React from 'react'
import Button from './Button'
import { FiFolder, FiPlus } from 'react-icons/fi'

export default function EmptyState({
  icon: Icon = FiFolder,
  title = 'No items found',
  description = 'Get started by creating your first item.',
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#30363d]/60 bg-[#161b22]/40 px-6 py-16 text-center backdrop-blur-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#21262d] border border-[#30363d] text-gray-400 shadow-inner">
        <Icon className="h-7 w-7 text-blue-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-gray-400">{description}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button variant="primary" size="sm" onClick={onAction} className="gap-2">
            <FiPlus className="h-4 w-4" />
            {actionText}
          </Button>
        </div>
      )}
    </div>
  )
}

