"use client"

import { useStrategies } from '@/hooks/use-strategies'
import { Card, CardContent, CardHeader, CardTitle } from '@lumiere/shared/components/ui/card'
import { Button } from '@lumiere/shared/components/ui/button'
import { Badge } from '@lumiere/shared/components/ui/badge'
import { Edit, Archive, Loader2 } from 'lucide-react'
import { StrategyStatusBadge } from './StrategyStatusBadge'
import { useStrategyDeploymentStatus } from '@/hooks/queries/use-chevalier-queries'
import { useRouter } from 'next/navigation'
import type { Strategy } from '@/lib/api/types'

interface StrategyCardProps {
  strategy: Strategy
  highlighted?: boolean
  onActionComplete?: () => void
}

function StrategyCard({ strategy, highlighted, onActionComplete }: StrategyCardProps) {
  const router = useRouter()
  const { data: deploymentData, isLoading: isLoadingDeployment } = useStrategyDeploymentStatus(strategy.id)

  const deploymentStatus = deploymentData?.status || null
  const deploymentId = deploymentData?.deployment_id || null

  const handleEdit = () => {
    router.push(`/create?strategy=${strategy.id}`)
  }

  return (
    <Card
      data-strategy-id={strategy.id}
      className={`transition-all ${highlighted ? 'ring-2 ring-primary shadow-lg' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{strategy.name}</CardTitle>
          <div className="flex items-center gap-2">
            {isLoadingDeployment ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : deploymentStatus && deploymentId ? (
              <StrategyStatusBadge
                status={deploymentStatus}
                deploymentId={deploymentId}
                onActionComplete={onActionComplete}
              />
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not Deployed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {strategy.description || 'No description provided'}
        </p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-muted-foreground">Version:</span>
          <Badge variant="outline">{strategy.version}</Badge>

          {strategy.base_plugins && strategy.base_plugins.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground ml-4">Plugins:</span>
              {strategy.base_plugins.map((plugin) => (
                <Badge key={plugin} variant="secondary">
                  {plugin}
                </Badge>
              ))}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" variant="outline" disabled>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface StrategyListProps {
  filter?: 'all' | 'active' | 'inactive'
  highlightedStrategyId?: string | null
}

export function StrategyList({ filter = 'all', highlightedStrategyId }: StrategyListProps) {
  const { strategies, isLoading, error } = useStrategies()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-2/3 mb-4" />
              <div className="h-8 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Error loading strategies: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!strategies || strategies.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No strategies yet. Create your first strategy with Prophet AI!
            </p>
            <Button onClick={() => window.location.href = '/create'}>
              Create Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter strategies based on filter prop (placeholder for now)
  const filteredStrategies = strategies

  return (
    <div className="space-y-4">
      {filteredStrategies.map((strategy) => (
        <StrategyCard
          key={strategy.id}
          strategy={strategy}
          highlighted={strategy.id === highlightedStrategyId}
        />
      ))}
    </div>
  )
}
