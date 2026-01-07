"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { StrategyActionMenu } from './StrategyActionMenu'
import type { StrategyStatus } from '@/lib/api/types'

interface StrategyStatusBadgeProps {
  status: StrategyStatus | null
  deploymentId: string | null
  architectStrategyId?: string
  onActionComplete?: () => void
  onDeploy?: () => Promise<void>
  isDeploying?: boolean
  canDeploy?: boolean
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
  },
  INACTIVE: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20'
  }
}

export function StrategyStatusBadge({
  status,
  deploymentId,
  architectStrategyId,
  onActionComplete,
  onDeploy,
  isDeploying = false,
  canDeploy = true
}: StrategyStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use INACTIVE for null status (not deployed)
  const displayStatus = status || 'INACTIVE'
  const colors = statusColors[displayStatus] || statusColors.INACTIVE
  const hasActions = true // Always has actions now

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
    if (!isDeploying) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        disabled={isDeploying}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          ${colors.bg} ${colors.text}
          ${!isDeploying ? 'cursor-pointer hover:opacity-80' : 'cursor-wait'}
          transition-all
        `}
      >
        {isDeploying ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        )}
        <span className="text-sm font-medium">
          {isDeploying ? 'Deploying...' : displayStatus}
        </span>
        {!isDeploying && (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !isDeploying && (
        <StrategyActionMenu
          deploymentId={deploymentId}
          currentStatus={status}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onActionComplete={onActionComplete}
          onDeploy={onDeploy}
          canDeploy={canDeploy}
        />
      )}
    </div>
  )
}
