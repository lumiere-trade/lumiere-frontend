"use client"

import { useState, useRef, useEffect } from 'react'
import { StrategyActionMenu } from './StrategyActionMenu'
import type { StrategyStatus } from '@/lib/api/types'

interface StrategyStatusBadgeProps {
  status: StrategyStatus
  strategyId: string
  onActionComplete?: () => void
}

const statusColors = {
  INACTIVE: {
    dot: 'bg-gray-400',
    text: 'text-gray-600',
    bg: 'bg-gray-50'
  },
  ACTIVE: {
    dot: 'bg-green-500',
    text: 'text-green-700',
    bg: 'bg-green-50'
  },
  PAUSED: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-700',
    bg: 'bg-yellow-50'
  },
  STOPPED: {
    dot: 'bg-orange-500',
    text: 'text-orange-700',
    bg: 'bg-orange-50'
  },
  UNDEPLOYED: {
    dot: 'bg-gray-400',
    text: 'text-gray-500',
    bg: 'bg-gray-50'
  },
  ERROR: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50'
  }
}

export function StrategyStatusBadge({
  status,
  strategyId,
  onActionComplete
}: StrategyStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const colors = statusColors[status]
  const hasActions = ['ACTIVE', 'PAUSED', 'STOPPED', 'ERROR'].includes(status)

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClick = () => {
    if (hasActions) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        disabled={!hasActions}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          ${colors.bg} ${colors.text}
          ${hasActions ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
          transition-all
        `}
      >
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <span className="text-sm font-medium">{status}</span>
        {hasActions && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {isOpen && hasActions && (
        <StrategyActionMenu
          strategyId={strategyId}
          currentStatus={status}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onActionComplete={onActionComplete}
        />
      )}
    </div>
  )
}
