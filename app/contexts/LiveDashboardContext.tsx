/**
 * Live Dashboard Context
 * Provides real-time trading data via WebSocket to LiveDashboard components
 * Includes historical candle warm-up from Chronicler
 * Backend-calculated indicators (no GPU calculation)
 */
"use client"

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useDashboardWebSocket } from '@/hooks/use-dashboard-websocket'
import {
  fetchWarmupCandles,
  type ChroniclerCandle,
} from '@/lib/api/chronicler'
import {
  getDeploymentTrades,
  getIndicatorsHistory,
  type TradeResponse,
  type IndicatorHistoryItem,
} from '@/lib/api/chevalier'
import type {
  ConnectionStatus,
  LiveCandle,
  LiveIndicators,
  DashboardError,
} from '@/lib/api/courier'
import type { Candle, Trade } from '@/components/charts/types'
import type { Position } from '@/components/dashboard/live/PositionCard'
import type { RecentTrade } from '@/components/dashboard/live/RecentTradesCard'
import type { IndicatorData } from '@/lib/api/cartographe'

// ============================================================================
// TYPES
// ============================================================================

interface DeployedStrategyConfig {
  deploymentId: string
  strategyId: string
  strategyName: string
  symbol: string
  timeframe: string
  indicatorNames: string[]  // e.g., ["RSI(14)", "EMA(20)"]
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

  // Indicator data for chart (backend-calculated, real-time)
  indicatorData: IndicatorData[]

  // Position data (transformed for PositionCard)
  position: Position | null

  // Account data
  equity: number
  initialCapital: number
  realizedPnL: number
  totalTrades: number

  // Signals (transformed for RecentTradesCard)
  recentTrades: RecentTrade[]

  // Current indicator values (from WebSocket)
  indicators: Record<string, number>

  // Error state
  error: DashboardError | null

  // Warm-up state
  isWarmingUp: boolean

  // Actions
  connect: () => void
  disconnect: () => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const LiveDashboardContext = createContext<LiveDashboardContextType | undefined>(undefined)

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Round timestamp to timeframe interval
 * e.g., for 5m: 21:36:00 -> 21:35:00, 21:40:00 -> 21:40:00
 */
function roundToTimeframe(timestamp: number, timeframe: string): number {
  const minutes = parseInt(timeframe.replace('m', ''))
  const date = new Date(timestamp)
  const roundedMinutes = Math.floor(date.getMinutes() / minutes) * minutes
  date.setMinutes(roundedMinutes, 0, 0)
  return date.getTime()
}

/**
 * Merge two candles - update OHLCV properly
 */
function mergeCandles(existing: LiveCandle, incoming: LiveCandle): LiveCandle {
  return {
    t: existing.t, // Keep original rounded timestamp
    o: existing.o, // Keep original open
    h: Math.max(existing.h, incoming.h), // Update high
    l: Math.min(existing.l, incoming.l), // Update low
    c: incoming.c, // Update to latest close
    v: incoming.v, // Update to latest volume
  }
}

/**
 * Transform Chronicler candle format to LiveCandle format
 */
function chroniclerToLiveCandle(c: ChroniclerCandle): LiveCandle {
  return {
    t: new Date(c.timestamp).getTime(),
    o: parseFloat(c.open),
    h: parseFloat(c.high),
    l: parseFloat(c.low),
    c: parseFloat(c.close),
    v: parseFloat(c.volume),
  }
}

/**
 * Transform API TradeResponse to RecentTrade format
 */
function tradeResponseToRecentTrade(trade: TradeResponse): RecentTrade {
  return {
    id: trade.id,
    side: trade.side,
    price: parseFloat(trade.price),
    quantity: parseFloat(trade.quantity),
    pnl: trade.realized_pnl ? parseFloat(trade.realized_pnl) : null,
    pnlPct: trade.realized_pnl_pct ? parseFloat(trade.realized_pnl_pct) : null,
    timestamp: new Date(trade.executed_at),
    reason: trade.reason || undefined,
    indicators: trade.indicators || undefined,
  }
}

/**
 * Transform Chevalier indicator history to LiveIndicators format
 */
function indicatorHistoryToLiveIndicators(item: IndicatorHistoryItem): LiveIndicators {
  return {
    t: new Date(item.timestamp).getTime(),
    values: item.values,
  }
}

/**
 * Transform WebSocket indicators to IndicatorData format for chart
 *
 * Backend (Chevalier) calculates indicators using Cython and broadcasts them
 * with timestamps synced to candles. This function transforms the WebSocket
 * data into the format expected by MultiPanelChart.
 */
function transformIndicatorsToChartData(
  wsIndicators: LiveIndicators[],
  candles: Candle[]
): IndicatorData[] {
  if (wsIndicators.length === 0 || candles.length === 0) {
    return []
  }

  // Create timestamp -> candle index map
  const timestampToIndex = new Map<number, number>()
  candles.forEach((candle, idx) => {
    timestampToIndex.set(candle.t, idx)
  })

  // Group indicators by name
  const indicatorsByName = new Map<string, Map<number, number>>()

  for (const wsIndicator of wsIndicators) {
    const candleIndex = timestampToIndex.get(wsIndicator.t)
    if (candleIndex === undefined) continue

    // Add all indicator values for this timestamp
    for (const [name, value] of Object.entries(wsIndicator.values)) {
      const normalizedName = name.toUpperCase()

      if (!indicatorsByName.has(normalizedName)) {
        indicatorsByName.set(normalizedName, new Map())
      }

      indicatorsByName.get(normalizedName)!.set(candleIndex, value)
    }
  }

  // Convert to IndicatorData array
  const result: IndicatorData[] = []

  for (const [name, valuesMap] of indicatorsByName.entries()) {
    const values = Array.from(valuesMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([index, value]) => ({ index, value }))
      .filter(v => !isNaN(v.value))

    if (values.length > 0) {
      result.push({ name, values })
    }
  }

  console.log('[transformIndicators] Backend indicators:', {
    wsCount: wsIndicators.length,
    candleCount: candles.length,
    indicatorNames: result.map(r => r.name),
    sampleValues: result[0]?.values.slice(-3),
  })

  return result
}

// ============================================================================
// PROVIDER
// ============================================================================

interface LiveDashboardProviderProps {
  children: ReactNode
  userId: string
  config: DeployedStrategyConfig
  initialCapital?: number
  warmupCandles?: number
}

export function LiveDashboardProvider({
  children,
  userId,
  config,
  initialCapital = 10000,
  warmupCandles = 500,
}: LiveDashboardProviderProps) {
  // Warm-up state
  const [historicalCandles, setHistoricalCandles] = useState<LiveCandle[]>([])
  const [historicalIndicators, setHistoricalIndicators] = useState<LiveIndicators[]>([])
  const [historicalTrades, setHistoricalTrades] = useState<RecentTrade[]>([])
  const [isWarmingUp, setIsWarmingUp] = useState(true)

  // Fetch historical candles on mount
  useEffect(() => {
    let cancelled = false

    async function loadWarmup() {
      setIsWarmingUp(true)

      try {
        console.log('[Warmup] Fetching historical candles...', {
          symbol: config.symbol,
          timeframe: config.timeframe,
          target: warmupCandles,
        })

        const candles = await fetchWarmupCandles(
          config.symbol,
          config.timeframe,
          warmupCandles
        )

        if (!cancelled) {
          const transformed = candles.map(chroniclerToLiveCandle)
          setHistoricalCandles(transformed)
          console.log('[Warmup] Loaded', transformed.length, 'historical candles')
        }
      } catch (err) {
        console.error('[Warmup] Failed to load historical candles:', err)
      } finally {
        if (!cancelled) {
          setIsWarmingUp(false)
        }
      }
    }

    loadWarmup()

    return () => {
      cancelled = true
    }
  }, [config.symbol, config.timeframe, warmupCandles])

  // Fetch historical indicators on mount
  useEffect(() => {
    let cancelled = false

    async function loadIndicatorHistory() {
      try {
        console.log('[Indicators] Fetching historical indicators...', {
          deploymentId: config.deploymentId,
          target: warmupCandles,
        })

        const response = await getIndicatorsHistory(config.deploymentId, warmupCandles)

        if (!cancelled) {
          const transformed = response.indicators.map(indicatorHistoryToLiveIndicators)
          setHistoricalIndicators(transformed)
          console.log('[Indicators] Loaded', transformed.length, 'historical indicators')
        }
      } catch (err) {
        console.error('[Indicators] Failed to load historical indicators:', err)
      }
    }

    loadIndicatorHistory()

    return () => {
      cancelled = true
    }
  }, [config.deploymentId, warmupCandles])

  // Fetch historical trades on mount
  useEffect(() => {
    let cancelled = false

    async function loadHistoricalTrades() {
      try {
        console.log('[Trades] Fetching historical trades...', {
          deploymentId: config.deploymentId,
        })

        const response = await getDeploymentTrades(config.deploymentId, 100)

        if (!cancelled) {
          const transformed = response.trades.map(tradeResponseToRecentTrade)
          setHistoricalTrades(transformed)
          console.log('[Trades] Loaded', transformed.length, 'historical trades')
        }
      } catch (err) {
        console.error('[Trades] Failed to load historical trades:', err)
      }
    }

    loadHistoricalTrades()

    return () => {
      cancelled = true
    }
  }, [config.deploymentId])

  // WebSocket hook - provides real-time data from Chevalier
  const {
    connectionStatus,
    isConnected,
    latencyMs,
    candles: liveCandles,
    indicators,
    indicatorsHistory: liveIndicators,
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

  // Merge historical + live candles with timeframe rounding
  const chartCandles: Candle[] = useMemo(() => {
    // Start with historical candles
    const merged = [...historicalCandles]

    // Add/update live candles with timeframe rounding
    for (const live of liveCandles) {
      // Round live candle timestamp to timeframe interval
      const roundedT = roundToTimeframe(live.t, config.timeframe)

      const existingIdx = merged.findIndex(c => c.t === roundedT)

      if (existingIdx >= 0) {
        // Update existing candle (merge OHLCV)
        merged[existingIdx] = mergeCandles(merged[existingIdx], {
          ...live,
          t: roundedT,
        })
      } else if (merged.length === 0 || roundedT > merged[merged.length - 1].t) {
        // Append new candle with rounded timestamp
        merged.push({ ...live, t: roundedT })
      }
    }

    // Sort by timestamp and limit to max candles
    merged.sort((a, b) => a.t - b.t)
    return merged.slice(-500)
  }, [historicalCandles, liveCandles, config.timeframe])

  // Merge historical + live indicators with timeframe rounding
  const allIndicators: LiveIndicators[] = useMemo(() => {
    // Start with historical indicators
    const merged = [...historicalIndicators]

    // Add/update live indicators with timeframe rounding
    for (const live of liveIndicators) {
      // Round live indicator timestamp to timeframe interval
      const roundedT = roundToTimeframe(live.t, config.timeframe)

      const existingIdx = merged.findIndex(i => i.t === roundedT)

      if (existingIdx >= 0) {
        // Update existing indicator (replace with latest values)
        merged[existingIdx] = { t: roundedT, values: live.values }
      } else if (merged.length === 0 || roundedT > merged[merged.length - 1].t) {
        // Append new indicator with rounded timestamp
        merged.push({ t: roundedT, values: live.values })
      }
    }

    // Sort by timestamp
    merged.sort((a, b) => a.t - b.t)
    return merged
  }, [historicalIndicators, liveIndicators, config.timeframe])

  // Transform backend indicators to chart format
  const indicatorData: IndicatorData[] = useMemo(() => {
    return transformIndicatorsToChartData(allIndicators, chartCandles)
  }, [allIndicators, chartCandles])

  // Merge historical trades + live signals into recentTrades
  const recentTrades: RecentTrade[] = useMemo(() => {
    // Convert live signals to RecentTrade format
    const liveTrades: RecentTrade[] = signals.map(signal => ({
      id: signal.id,
      side: signal.type === 'ENTRY' ? 'BUY' : 'SELL',
      price: signal.price,
      quantity: livePosition?.size || 0,
      pnl: signal.type === 'EXIT' ? (livePosition?.realizedPnL || null) : null,
      pnlPct: null,
      timestamp: signal.timestamp,
      reason: signal.reasons?.join(', '),
    }))

    // Merge: historical trades + live trades (avoiding duplicates by id)
    const historicalIds = new Set(historicalTrades.map(t => t.id))
    const newLiveTrades = liveTrades.filter(t => !historicalIds.has(t.id))

    // Combine and sort by timestamp (newest first for display)
    const merged = [...historicalTrades, ...newLiveTrades]
    merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return merged
  }, [historicalTrades, signals, livePosition])

  // Transform recentTrades to chart markers (with quantity, value, pnl)
  const chartTrades: Trade[] = useMemo(() => {
    return [...recentTrades]
      .reverse()
      .map(trade => ({
        t: trade.timestamp.getTime(),
        p: trade.price,
        s: trade.side === 'BUY' ? 'B' : 'S',
        q: trade.quantity,
        val: trade.price * trade.quantity,
        reason: trade.reason,
        indicators: trade.indicators,
        pnl: trade.pnl ?? undefined,
        pnl_pct: trade.pnlPct ?? undefined,
      }))
  }, [recentTrades])

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

  // Account values
  const equity = livePosition?.totalEquity || initialCapital
  const realizedPnL = livePosition?.realizedPnL || 0
  const totalTrades = recentTrades.length

  const value: LiveDashboardContextType = {
    config,
    connectionStatus,
    isConnected,
    latencyMs,
    chartCandles,
    chartTrades,
    indicatorData,
    position,
    equity,
    initialCapital,
    realizedPnL,
    totalTrades,
    recentTrades,
    indicators,
    error,
    isWarmingUp,
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
// UTILITY: Build config from TSDL-validated data
// ============================================================================

/**
 * Build DeployedStrategyConfig from TSDL-validated data.
 *
 * IMPORTANT: This accepts already-validated data from TSDL /data/all API.
 * Do NOT pass raw tsdl_code - parse it through TSDL API first.
 */
export function buildStrategyConfig(
  deploymentId: string,
  strategyId: string,
  strategyName: string,
  validatedData: {
    symbol: string
    timeframe: string
    indicators: string[]
  }
): DeployedStrategyConfig {
  return {
    deploymentId,
    strategyId,
    strategyName,
    symbol: validatedData.symbol,
    timeframe: validatedData.timeframe,
    indicatorNames: validatedData.indicators,
  }
}
