"use client"

import { useState } from "react"
import { SystemStatusBar } from "./SystemStatusBar"
import { AccountSummary } from "./AccountSummary"
import { PositionCard, Position } from "./PositionCard"
import { StrategyStatusCard } from "./StrategyStatusCard"
import { RecentTradesCard, RecentTrade } from "./RecentTradesCard"
import { MultiPanelChart } from "@/components/charts/MultiPanelChart"
import { Card, CardContent, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import type { StrategyStatus, DeploymentStatusResponse } from "@/lib/api/types"
import type { Candle, Trade, Indicator } from "@/components/charts/types"

interface LiveDashboardProps {
  deployment: DeploymentStatusResponse
  strategyName: string
  strategyJson: Record<string, any>
  candles?: Candle[]
  trades?: Trade[]
  indicators?: Indicator[]
  position?: Position | null
  recentTrades?: RecentTrade[]
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  onEdit?: () => void
  isPausing?: boolean
  isResuming?: boolean
  isStopping?: boolean
  isLoadingData?: boolean
}

export function LiveDashboard({
  deployment,
  strategyName,
  strategyJson,
  candles = [],
  trades = [],
  indicators = [],
  position = null,
  recentTrades = [],
  onPause,
  onResume,
  onStop,
  onEdit,
  isPausing = false,
  isResuming = false,
  isStopping = false,
  isLoadingData = false
}: LiveDashboardProps) {
  const [isConnected] = useState(true)
  const [lastUpdate] = useState(new Date())
  const [latencyMs] = useState(45)

  const strategyInfo = {
    name: strategyName,
    symbol: strategyJson.symbol || "SOL/USDC",
    timeframe: strategyJson.timeframe || "1h",
    status: deployment.status as StrategyStatus,
    deployedAt: new Date(deployment.created_at),
    totalTrades: recentTrades.length,
    winRate: recentTrades.length > 0
      ? (recentTrades.filter(t => t.pnl && t.pnl > 0).length / recentTrades.filter(t => t.pnl !== null).length) * 100
      : 0,
    version: deployment.version
  }

  const initialCapital = 10000
  const currentCapital = deployment.current_capital || initialCapital
  const todayPnL = 0
  const openPnL = position?.unrealizedPnL || 0

  return (
    <div className="flex flex-col h-full">
      <SystemStatusBar
        isConnected={isConnected}
        lastUpdate={lastUpdate}
        latencyMs={latencyMs}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AccountSummary
          equity={currentCapital}
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
                    {strategyJson.symbol} - {strategyJson.timeframe}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {candles.length > 0
                      ? `${candles.length} candles loaded`
                      : "Waiting for data..."
                    }
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candles.length > 0 ? (
                  <MultiPanelChart
                    candles={candles}
                    trades={trades}
                    indicatorData={[]}
                    timeframe={strategyJson.timeframe}
                    mode="C"
                    showIndicatorToggles={true}
                  />
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-medium">No Market Data</p>
                      <p className="text-sm mt-1">
                        Real-time data will appear when connected
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
