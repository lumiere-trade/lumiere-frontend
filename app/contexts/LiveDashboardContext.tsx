/**
 * Live Dashboard Context
 * Provides real-time trading data via WebSocket to LiveDashboard components
 */

"use client"

import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react'
import { useDashboardWebSocket } from '@/hooks/use-dashboard-websocket'
import type {
  ConnectionStatus,
  LiveCandle,
  LivePosition,
  LiveSignal,
  DashboardError,
} from '@/lib/api/courier'
import type { Candle, Trade } from '@/components/charts/types'
import type { Position } from '@/components/dashboard/live/PositionCard'
import type { RecentTrade } from '@/components/dashboard/live/RecentTradesCard'

// ============================================================================
// TYPES
// ============================================================================

interface DeployedStrategyConfig {
  deploymentId: string
  strategyId: string
  strategyName: string
  symbol: string
  timeframe: string
  indicatorNames: string[]  // e.g., ["RSI", "EMA_20"]
}

interface LiveDashboardContextType {
  // Strategy config
  config: DeployedStrategyConfig
  
  // Connection
  connectionStatus: ConnectionStatus
  isConnected: boolean
  latencyMs: number | null
  
  // Chart data (transformed for MultiPanelChart)
  chartCandles: Candle[]
  chartTrades: Trade[]
  
  // Position data (transformed for PositionCard)
  position: Position | null
  
  // Account data
  equity: number
  initialCapital: number
  realizedPnL: number
  totalTrades: number
  
  // Signals (transformed for RecentTradesCard)
  recentTrades: RecentTrade[]
  
  // Indicators
  indicators: Record<string, number>
  
  // Error state
  error: DashboardError | null
  
  // Actions
  connect: () => void
  disconnect: () => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const LiveDashboardContext = createContext<LiveDashboardContextType | undefined>(undefined)

// ============================================================================
// PROVIDER
// ============================================================================

interface LiveDashboardProviderProps {
  children: ReactNode
  userId: string
  config: DeployedStrategyConfig
  initialCapital?: number
}

export function LiveDashboardProvider({
  children,
  userId,
  config,
  initialCapital = 10000,
}: LiveDashboardProviderProps) {
  // WebSocket hook
  const {
    connectionStatus,
    isConnected,
    latencyMs,
    candles: liveCandles,
    indicators,
    position: livePosition,
    signals,
    error,
    connect,
    disconnect,
  } = useDashboardWebSocket({
    userId,
    deploymentId: config.deploymentId,
    enabled: true,
  })
  
  // Transform candles for chart
  const chartCandles: Candle[] = useMemo(() => {
    return liveCandles.map(c => ({
      t: c.t,
      o: c.o,
      h: c.h,
      l: c.l,
      c: c.c,
      v: c.v,
    }))
  }, [liveCandles])
  
  // Transform signals to trades for chart markers
  const chartTrades: Trade[] = useMemo(() => {
    return signals.map(signal => ({
      t: signal.timestamp.getTime(),
      p: signal.price,
      s: signal.type === 'ENTRY' ? 'B' : 'S',
      reason: signal.reasons.join(', '),
      indicators: signal.indicators,
    }))
  }, [signals])
  
  // Transform position for PositionCard
  const position: Position | null = useMemo(() => {
    if (!livePosition || !livePosition.hasPosition) {
      return null
    }
    
    return {
      side: livePosition.side || 'LONG',
      entryPrice: livePosition.entryPrice,
      currentPrice: livePosition.currentPrice,
      quantity: livePosition.size,
      value: livePosition.value,
      unrealizedPnL: livePosition.unrealizedPnL,
      unrealizedPnLPct: livePosition.unrealizedPnLPct,
      stopLoss: null,  // TODO: Get from strategy config
      takeProfit: null,  // TODO: Get from strategy config
      entryTime: new Date(),  // TODO: Track entry time
    }
  }, [livePosition])
  
  // Transform signals to recent trades for RecentTradesCard
  const recentTrades: RecentTrade[] = useMemo(() => {
    return signals.map(signal => ({
      id: signal.id,
      side: signal.type === 'ENTRY' ? 'BUY' : 'SELL',
      price: signal.price,
      quantity: livePosition?.size || 0,
      pnl: signal.type === 'EXIT' ? (livePosition?.realizedPnL || null) : null,
      pnlPct: null,  // TODO: Calculate
      timestamp: signal.timestamp,
    }))
  }, [signals, livePosition])
  
  // Account values
  const equity = livePosition?.totalEquity || initialCapital
  const realizedPnL = livePosition?.realizedPnL || 0
  const totalTrades = livePosition?.totalTrades || 0
  
  const value: LiveDashboardContextType = {
    config,
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
    connect,
    disconnect,
  }
  
  return (
    <LiveDashboardContext.Provider value={value}>
      {children}
    </LiveDashboardContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useLiveDashboard() {
  const context = useContext(LiveDashboardContext)
  
  if (context === undefined) {
    throw new Error('useLiveDashboard must be used within a LiveDashboardProvider')
  }
  
  return context
}

// ============================================================================
// UTILITY: Parse strategy config from TSDL
// ============================================================================

export function parseStrategyConfig(
  deploymentId: string,
  strategyId: string,
  strategyName: string,
  tsdlCode: string
): DeployedStrategyConfig {
  try {
    const tsdl = JSON.parse(tsdlCode)
    
    // Extract indicator names from strategy
    const indicatorNames: string[] = []
    
    // Check entry conditions for indicators
    if (tsdl.strategy?.entry?.conditions) {
      for (const condition of tsdl.strategy.entry.conditions) {
        if (condition.indicator) {
          const params = condition.params
            ? `_${Object.values(condition.params).join('_')}`
            : ''
          indicatorNames.push(`${condition.indicator}${params}`)
        }
      }
    }
    
    // Check exit conditions
    if (tsdl.strategy?.exit?.conditions) {
      for (const condition of tsdl.strategy.exit.conditions) {
        if (condition.indicator) {
          const params = condition.params
            ? `_${Object.values(condition.params).join('_')}`
            : ''
          const name = `${condition.indicator}${params}`
          if (!indicatorNames.includes(name)) {
            indicatorNames.push(name)
          }
        }
      }
    }
    
    return {
      deploymentId,
      strategyId,
      strategyName,
      symbol: tsdl.symbol || 'SOL/USDC',
      timeframe: tsdl.timeframe || '1h',
      indicatorNames,
    }
  } catch (error) {
    console.error('Failed to parse TSDL:', error)
    
    // Return defaults
    return {
      deploymentId,
      strategyId,
      strategyName,
      symbol: 'SOL/USDC',
      timeframe: '1h',
      indicatorNames: [],
    }
  }
}
