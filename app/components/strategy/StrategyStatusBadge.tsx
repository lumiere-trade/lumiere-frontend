"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { StrategyActionMenu } from './StrategyActionMenu'
import type { StrategyStatus } from '@/lib/api/types'

interface StrategyStatusBadgeProps {
  status: StrategyStatus
  deploymentId: string
  onActionComplete?: () => void
}

const statusColors = {
  ACTIVE: {
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20'
  },
  PAUSED: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20'
  },
  STOPPED: {
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20'
  },
  UNDEPLOYED: {
    dot: 'bg-gray-400',
    text: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800'
  },
  ERROR: {
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20'
  }
}

export function StrategyStatusBadge({
  status,
  deploymentId,
  onActionComplete
}: StrategyStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const colors = statusColors[status] || statusColors.UNDEPLOYED
  const hasActions = ['ACTIVE', 'PAUSED', 'STOPPED', 'ERROR'].includes(status)

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
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && hasActions && (
        <StrategyActionMenu
          deploymentId={deploymentId}
          currentStatus={status}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onActionComplete={onActionComplete}
        />
      )}
    </div>
  )
}
