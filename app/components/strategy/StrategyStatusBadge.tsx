"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader2, Play } from 'lucide-react'
import { Button } from '@lumiere/shared/components/ui/button'
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // NOT DEPLOYED: Show Deploy button
  if (!status) {
    return (
      <Button
        size="sm"
        onClick={onDeploy}
        disabled={!canDeploy || isDeploying}
        className="gap-2 min-w-[120px] text-md"
      >
        {isDeploying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Deploying...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Deploy
          </>
        )}
      </Button>
    )
  }

  // DEPLOYED: Show Manage dropdown button
  const handleClick = () => {
    if (!isDeploying) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={isDeploying}
        className="gap-2 min-w-[120px] text-md"
      >
        {isDeploying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Managing...
          </>
        ) : (
          <>
            Manage
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </Button>

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
