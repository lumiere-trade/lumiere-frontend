"use client"

import { useState } from 'react'
import {
  usePauseDeployment,
  useResumeDeployment,
  useStopDeployment,
  useUndeployDeployment
} from '@/hooks/mutations/use-chevalier-mutations'
import type { StrategyStatus } from '@/lib/api/types'
import { Loader2, Pause, Play, Square, Trash2 } from 'lucide-react'

interface StrategyActionMenuProps {
  deploymentId: string
  currentStatus: StrategyStatus
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

interface Action {
  label: string
  icon: React.ReactNode
  handler: () => Promise<any>
  confirm: boolean
  variant?: 'default' | 'destructive'
}

export function StrategyActionMenu({
  deploymentId,
  currentStatus,
  isOpen,
  onClose,
  onActionComplete
}: StrategyActionMenuProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const pauseMutation = usePauseDeployment()
  const resumeMutation = useResumeDeployment()
  const stopMutation = useStopDeployment()
  const undeployMutation = useUndeployDeployment()

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
            icon: <Pause className="h-4 w-4" />,
            handler: () => pauseMutation.mutateAsync(deploymentId),
            confirm: false
          },
          {
            label: 'Stop',
            icon: <Square className="h-4 w-4" />,
            handler: () => stopMutation.mutateAsync(deploymentId),
            confirm: true,
            variant: 'destructive'
          }
        )
        break
      case 'PAUSED':
        actions.push(
          {
            label: 'Resume',
            icon: <Play className="h-4 w-4" />,
            handler: () => resumeMutation.mutateAsync(deploymentId),
            confirm: false
          },
          {
            label: 'Stop',
            icon: <Square className="h-4 w-4" />,
            handler: () => stopMutation.mutateAsync(deploymentId),
            confirm: true,
            variant: 'destructive'
          }
        )
        break
      case 'STOPPED':
        actions.push(
          {
            label: 'Resume',
            icon: <Play className="h-4 w-4" />,
            handler: () => resumeMutation.mutateAsync(deploymentId),
            confirm: false
          },
          {
            label: 'Undeploy',
            icon: <Trash2 className="h-4 w-4" />,
            handler: () => undeployMutation.mutateAsync(deploymentId),
            confirm: true,
            variant: 'destructive'
          }
        )
        break
      case 'ERROR':
        actions.push(
          {
            label: 'Resume',
            icon: <Play className="h-4 w-4" />,
            handler: () => resumeMutation.mutateAsync(deploymentId),
            confirm: false
          },
          {
            label: 'Stop',
            icon: <Square className="h-4 w-4" />,
            handler: () => stopMutation.mutateAsync(deploymentId),
            confirm: false
          },
          {
            label: 'Undeploy',
            icon: <Trash2 className="h-4 w-4" />,
            handler: () => undeployMutation.mutateAsync(deploymentId),
            confirm: true,
            variant: 'destructive'
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
          className={`
            w-full px-4 py-2 text-left text-sm flex items-center gap-3
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${action.variant === 'destructive'
              ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          {action.icon}
          <span>{action.label}</span>
          {loading === action.label && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </button>
      ))}
    </div>
  )
}
