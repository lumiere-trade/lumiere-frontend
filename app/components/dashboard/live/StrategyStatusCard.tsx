"use client"

import { Play, Pause, Square, AlertCircle, Clock, TrendingUp, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@lumiere/shared/components/ui/button"
import type { StrategyStatus } from "@/lib/api/types"

interface StrategyInfo {
  name: string
  symbol: string
  timeframe: string
  status: StrategyStatus
  deployedAt: Date
  totalTrades: number
  winRate: number
  version: number
}

interface StrategyStatusCardProps {
  strategy: StrategyInfo | null
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  onEdit?: () => void
  isLoading?: boolean
  isPausing?: boolean
  isResuming?: boolean
  isStopping?: boolean
}

const statusConfig: Record<StrategyStatus, {
  label: string
  variant: "success" | "warning" | "destructive" | "secondary" | "outline"
  icon: typeof Play
  pulse: boolean
}> = {
  ACTIVE: { label: "Running", variant: "success", icon: Play, pulse: true },
  PAUSED: { label: "Paused", variant: "warning", icon: Pause, pulse: false },
  STOPPED: { label: "Stopped", variant: "destructive", icon: Square, pulse: false },
  UNDEPLOYED: { label: "Undeployed", variant: "secondary", icon: Square, pulse: false },
  ERROR: { label: "Error", variant: "destructive", icon: AlertCircle, pulse: true },
}

export function StrategyStatusCard({
  strategy,
  onPause,
  onResume,
  onStop,
  onEdit,
  isLoading = false,
  isPausing = false,
  isResuming = false,
  isStopping = false
}: StrategyStatusCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
        <div className="h-6 w-32 bg-muted/50 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-muted/50 animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!strategy) {
    return null
  }

  const config = statusConfig[strategy.status]
  const StatusIcon = config.icon

  const formatDuration = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`
    return `${diffMins}m`
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Active Strategy
        </h3>
        <Badge variant={config.variant} className="gap-1">
          {config.pulse && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
          )}
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Strategy Name */}
        <div>
          <h4 className="text-lg font-semibold text-foreground">
            {strategy.name}
          </h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            {strategy.symbol} / {strategy.timeframe} / v{strategy.version}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-primary/10" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Trades
            </p>
            <p className="text-base font-semibold">{strategy.totalTrades}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Win Rate
            </p>
            <p className="text-base font-semibold">{strategy.winRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Running Time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Running for {formatDuration(strategy.deployedAt)}
        </div>

        {/* Divider */}
        <div className="border-t border-primary/10" />

        {/* Actions */}
        <div className="flex gap-2">
          {strategy.status === "ACTIVE" && onPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              disabled={isPausing}
              className="flex-1"
            >
              <Pause className="h-3 w-3 mr-1" />
              {isPausing ? "Pausing..." : "Pause"}
            </Button>
          )}

          {strategy.status === "PAUSED" && onResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResume}
              disabled={isResuming}
              className="flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              {isResuming ? "Resuming..." : "Resume"}
            </Button>
          )}

          {(strategy.status === "ACTIVE" || strategy.status === "PAUSED") && onStop && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              disabled={isStopping}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Square className="h-3 w-3 mr-1" />
              {isStopping ? "Stopping..." : "Stop"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
