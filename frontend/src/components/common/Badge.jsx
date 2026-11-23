import React from 'react'

export default function Badge({
  children,
  text,
  variant = 'default',
  size = 'md',
  small = false,
  className = '',
}) {
  const content = children ?? text

  const variantStyles = {
    default: 'bg-gray-800 text-gray-300 border-gray-700',
    primary: 'bg-blue-950/70 text-blue-400 border-blue-800/60',
    success: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/70 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/70 text-rose-400 border-rose-800/60',
    info: 'bg-cyan-950/70 text-cyan-400 border-cyan-800/60',
  }

  const effectiveSize = small ? 'sm' : size

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[effectiveSize] || sizeStyles.md} ${className}`}
    >
      {content}
    </span>
  )
}
