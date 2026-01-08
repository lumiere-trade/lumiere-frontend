"use client"

import { SystemStatusBar } from "./SystemStatusBar"
import { AccountSummary } from "./AccountSummary"
import { PositionCard } from "./PositionCard"
import { StrategyStatusCard } from "./StrategyStatusCard"
import { RecentTradesCard } from "./RecentTradesCard"
import { MultiPanelChart } from "@/components/charts/MultiPanelChart"
import { Card, CardContent, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { useLiveDashboard } from "@/contexts/LiveDashboardContext"
import type { StrategyStatus, DeploymentStatusResponse } from "@/lib/api/types"

interface LiveDashboardProps {
  deployment: DeploymentStatusResponse
  strategyName: string
  strategyJson: Record<string, any>
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  onEdit?: () => void
  isPausing?: boolean
  isResuming?: boolean
  isStopping?: boolean
}

export function LiveDashboard({
  deployment,
  strategyName,
  strategyJson,
  onPause,
  onResume,
  onStop,
  onEdit,
  isPausing = false,
  isResuming = false,
  isStopping = false,
}: LiveDashboardProps) {
  // Get real-time data from context
  const {
    connectionStatus,
    isConnected,
    latencyMs,
    chartCandles,
    chartTrades,
    position,
    equity,
    initialCapital,
    realizedPnL,
    totalTrades,
    recentTrades,
    indicators,
    error,
  } = useLiveDashboard()

  // Strategy info for StrategyStatusCard
  const strategyInfo = {
    name: strategyName,
    symbol: strategyJson.symbol || "SOL/USDC",
    timeframe: strategyJson.timeframe || "1h",
    status: deployment.status as StrategyStatus,
    deployedAt: new Date(deployment.created_at),
    totalTrades: totalTrades,
    winRate: recentTrades.length > 0
      ? (recentTrades.filter(t => t.pnl && t.pnl > 0).length / recentTrades.filter(t => t.pnl !== null).length) * 100
      : 0,
    version: deployment.version
  }

  // Calculate P&L values
  const todayPnL = realizedPnL  // TODO: Filter by today
  const openPnL = position?.unrealizedPnL || 0

  // Loading state based on connection
  const isLoadingData = !isConnected && chartCandles.length === 0

  return (
    <div className="flex flex-col h-full">
      <SystemStatusBar
        isConnected={isConnected}
        lastUpdate={connectionStatus.lastMessageAt}
        latencyMs={latencyMs}
        hasError={!!error}
        errorMessage={error?.last_error}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AccountSummary
          equity={equity}
          initialCapital={initialCapital}
          todayPnL={todayPnL}
          openPnL={openPnL}
          isInPosition={position !== null}
          isLoading={isLoadingData}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>
                    {strategyJson.symbol || "SOL/USDC"} - {strategyJson.timeframe || "1h"}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {chartCandles.length > 0
                      ? `${chartCandles.length} candles`
                      : isConnected
                        ? "Waiting for data..."
                        : "Connecting..."
                    }
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartCandles.length > 0 ? (
                  <MultiPanelChart
                    candles={chartCandles}
                    trades={chartTrades}
                    indicatorData={[]}
                    timeframe={strategyJson.timeframe || "1h"}
                    mode="C"
                    showIndicatorToggles={true}
                  />
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-medium">
                        {isConnected ? "Waiting for Market Data" : "Connecting..."}
                      </p>
                      <p className="text-sm mt-1">
                        {isConnected
                          ? "Real-time data will appear shortly"
                          : connectionStatus.reconnectAttempts > 0
                            ? `Reconnecting (attempt ${connectionStatus.reconnectAttempts})...`
                            : "Establishing connection..."
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <PositionCard
              position={position}
              symbol={strategyJson.symbol || "SOL/USDC"}
              isLoading={isLoadingData}
            />

            <StrategyStatusCard
              strategy={strategyInfo}
              onPause={onPause}
              onResume={onResume}
              onStop={onStop}
              onEdit={onEdit}
              isPausing={isPausing}
              isResuming={isResuming}
              isStopping={isStopping}
            />

            <RecentTradesCard
              trades={recentTrades}
              symbol={strategyJson.symbol || "SOL/USDC"}
              isLoading={isLoadingData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
