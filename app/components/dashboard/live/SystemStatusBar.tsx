"use client"

import { Circle, Wifi, WifiOff, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@lumiere/shared/lib/utils"

interface SystemStatusBarProps {
  isConnected: boolean
  lastUpdate: Date | null
  latencyMs: number | null
  hasError?: boolean
  errorMessage?: string
}

export function SystemStatusBar({
  isConnected,
  lastUpdate,
  latencyMs,
  hasError = false,
  errorMessage
}: SystemStatusBarProps) {
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "Never"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 5) return "Just now"
    if (diffSecs < 60) return `${diffSecs}s ago`
    return `${Math.floor(diffSecs / 60)}m ago`
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card/50 border-b border-primary/10 text-xs">
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Connected</span>
            </>
          ) : (
            <>
              <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
              <WifiOff className="h-3 w-3 text-red-500" />
              <span className="text-red-500">Disconnected</span>
            </>
          )}
        </div>

        {/* Data Feed Status */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last Update: {formatLastUpdate(lastUpdate)}</span>
        </div>

        {/* Latency */}
        {latencyMs !== null && (
          <div className="flex items-center gap-1.5">
            <span className={cn(
              latencyMs < 100 ? "text-green-500" :
              latencyMs < 500 ? "text-yellow-500" :
              "text-red-500"
            )}>
              {latencyMs}ms
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && errorMessage && (
        <div className="flex items-center gap-1.5 text-red-500">
          <AlertTriangle className="h-3 w-3" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
