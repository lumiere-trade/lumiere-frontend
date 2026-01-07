"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import {
  usePauseStrategy,
  useResumeStrategy,
  useStopStrategy,
  useUndeployStrategy
} from '@/hooks/mutations/use-chevalier-mutations'
import type { StrategyStatus } from '@/lib/api/types'
import { Loader2 } from 'lucide-react'

interface StrategyActionMenuProps {
  strategyId: string
  currentStatus: StrategyStatus
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

interface Action {
  label: string
  icon: string
  handler: () => Promise<any>
  confirm: boolean
}

export function StrategyActionMenu({
  strategyId,
  currentStatus,
  isOpen,
  onClose,
  onActionComplete
}: StrategyActionMenuProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const pauseMutation = usePauseStrategy()
  const resumeMutation = useResumeStrategy()
  const stopMutation = useStopStrategy()
  const undeployMutation = useUndeployStrategy()

  const handleAction = async (
    action: () => Promise<any>,
    actionName: string,
    needsConfirm: boolean = false
  ) => {
    if (needsConfirm) {
      const confirmed = window.confirm(
        `Are you sure you want to ${actionName.toLowerCase()} this strategy?`
      )
      if (!confirmed) return
    }

    setLoading(actionName)

    try {
      await action()
      onActionComplete?.()
      onClose()
    } catch (error) {
      // Error already handled by mutation
    } finally {
      setLoading(null)
    }
  }

  const getActionsForStatus = (): Action[] => {
    const actions: Action[] = []

    switch (currentStatus) {
      case 'ACTIVE':
        actions.push(
          {
            label: 'Pause',
            icon: '⏸',
            handler: () => pauseMutation.mutateAsync(strategyId),
            confirm: false
          },
          {
            label: 'Stop',
            icon: '⏹',
            handler: () => stopMutation.mutateAsync(strategyId),
            confirm: true
          }
        )
        break
      case 'PAUSED':
        actions.push(
          {
            label: 'Resume',
            icon: '▶',
            handler: () => resumeMutation.mutateAsync(strategyId),
            confirm: false
          },
          {
            label: 'Stop',
            icon: '⏹',
            handler: () => stopMutation.mutateAsync(strategyId),
            confirm: true
          }
        )
        break
      case 'STOPPED':
        actions.push({
          label: 'Undeploy',
          icon: '🗑',
          handler: () => undeployMutation.mutateAsync(strategyId),
          confirm: true
        })
        break
      case 'ERROR':
        actions.push(
          {
            label: 'Stop',
            icon: '⏹',
            handler: () => stopMutation.mutateAsync(strategyId),
            confirm: false
          },
          {
            label: 'Undeploy',
            icon: '🗑',
            handler: () => undeployMutation.mutateAsync(strategyId),
            confirm: true
          }
        )
        break
    }

    return actions
  }

  const actions = getActionsForStatus()

  if (!isOpen || actions.length === 0) return null

  return (
    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => handleAction(action.handler, action.label, action.confirm)}
          disabled={loading !== null}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-base">{action.icon}</span>
          <span>{action.label}</span>
          {loading === action.label && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </button>
      ))}
    </div>
  )
}
