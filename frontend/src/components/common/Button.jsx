import React from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const isSpinning = isLoading || loading
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 shadow-lg shadow-blue-500/20',
    secondary: 'bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] focus:ring-gray-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-lg shadow-rose-500/20',
    ghost: 'hover:bg-[#21262d] text-gray-400 hover:text-gray-200 focus:ring-gray-500',
    outline: 'border border-blue-500/50 text-blue-400 hover:bg-blue-950/30 focus:ring-blue-500',
  }

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }

  return (
    <button
      type={type}
      disabled={disabled || isSpinning}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isSpinning && <LoadingSpinner size="sm" className="mr-1.5 text-current" />}
      {children}
    </button>
  )
}
