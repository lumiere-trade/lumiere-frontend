"use client"

import { useState } from 'react'
import {
  usePauseDeployment,
  useResumeDeployment,
  useStopDeployment,
  useUndeployDeployment
} from '@/hooks/mutations/use-chevalier-mutations'
import type { StrategyStatus } from '@/lib/api/types'
import { Loader2, Pause, Play, Square, Trash2, Rocket, Check } from 'lucide-react'

interface StrategyActionMenuProps {
  deploymentId: string | null
  currentStatus: StrategyStatus | null
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
  onDeploy?: () => Promise<void>
  canDeploy?: boolean
}

interface Action {
  label: string
  icon: React.ReactNode
  handler: () => Promise<any>
  confirm: boolean
  variant?: 'default' | 'destructive' | 'success'
}

export function StrategyActionMenu({
  deploymentId,
  currentStatus,
  isOpen,
  onClose,
  onActionComplete,
  onDeploy,
  canDeploy = true
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

    // No deployment exists - show Deploy option
    if (currentStatus === null) {
      if (onDeploy && canDeploy) {
        actions.push({
          label: 'Deploy',
          icon: <Rocket className="h-4 w-4" />,
          handler: async () => {
            await onDeploy()
          },
          confirm: false,
          variant: 'success'
        })
      }
      return actions
    }

    // Deployment exists - show lifecycle actions
    if (!deploymentId) return actions

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
    <div className="absolute top-full right-0 mt-2 w-44 bg-background rounded-xl shadow-lg border border-border py-1 z-50">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => handleAction(action.handler, action.label, action.confirm)}
          disabled={loading !== null}
          className={`
            w-full px-3 py-2.5 text-left text-sm flex items-center gap-3
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${action.variant === 'destructive'
              ? 'text-destructive hover:bg-muted'
              : action.variant === 'success'
              ? 'text-green-600 dark:text-green-500 hover:bg-muted'
              : 'text-foreground hover:bg-muted'
            }
          `}
        >
          {action.icon}
          <span className="font-medium">{action.label}</span>
          {loading === action.label && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </button>
      ))}
    </div>
  )
}
