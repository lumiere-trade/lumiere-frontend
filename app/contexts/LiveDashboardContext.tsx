/**
 * Live Dashboard Context
 * Provides real-time trading data via WebSocket to LiveDashboard components
 * Includes historical candle warm-up from Chronicler
 * GPU-accelerated indicator calculation with real-time WebSocket sync
 */

"use client"

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react'
import { useDashboardWebSocket } from '@/hooks/use-dashboard-websocket'
import {
  fetchWarmupCandles,
  type ChroniclerCandle,
} from '@/lib/api/chronicler'
import { getDeploymentTrades, type TradeResponse } from '@/lib/api/chevalier'
import { calculateAllIndicators, type IndicatorResults } from '@/lib/gpu'
import type {
  ConnectionStatus,
  LiveCandle,
  LiveIndicators,
  DashboardError,
} from '@/lib/api/courier'
import type { Candle, Trade, Indicator } from '@/components/charts/types'
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
  indicatorNames: string[]  // e.g., ["rsi_16", "ema_20"]
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

  // Indicator data for chart (GPU-calculated + real-time sync)
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
  }
}

/**
 * Normalize indicator name to standard format for GPU calculation
 * Input formats: "RSI(16)", "EMA(20)", "MACD(12,26,9)"
 * Output format: "rsi_16", "ema_20", "macd_12_26_9"
 */
function normalizeIndicatorName(name: string): string {
  // Handle formats like "RSI(16)" -> "rsi_16"
  const match = name.match(/^([A-Za-z]+)\(([^)]+)\)$/)
  if (match) {
    const type = match[1].toLowerCase()
    const params = match[2].split(',').map(p => p.trim()).join('_')
    return `${type}_${params}`
  }
  // Already in snake_case format or simple name
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
}

/**
 * Parse indicator configs from strategy indicator names
 */
function parseIndicatorConfigs(
  indicatorNames: string[]
): Record<string, { type: string; params?: number[] }> {
  const configs: Record<string, { type: string; params?: number[] }> = {}

  for (const rawName of indicatorNames) {
    const name = normalizeIndicatorName(rawName)
    // Parse names like "rsi_16", "ema_20", "macd_12_26_9"
    const parts = name.split('_')
    const type = parts[0].toUpperCase()
    const params = parts.slice(1).map(Number).filter(n => !isNaN(n))

    configs[name] = { type, params: params.length > 0 ? params : undefined }
  }

  return configs
}

/**
 * Transform GPU indicator results to IndicatorData format for chart
 */
function transformToIndicatorData(
  results: IndicatorResults,
  indicatorConfigs: Record<string, { type: string; params?: number[] }>
): IndicatorData[] {
  const data: IndicatorData[] = []

  for (const [name, values] of Object.entries(results)) {
    // Filter out NaN values and create IndicatorValue array
    const indicatorValues = values
      .map((value, index) => ({ index, value }))
      .filter(v => !isNaN(v.value))

    if (indicatorValues.length > 0) {
      data.push({
        name: name.toUpperCase(),
        values: indicatorValues,
      })
    }
  }

  return data
}

/**
 * Merge GPU-calculated indicators with real-time WebSocket indicators
 * WebSocket provides timestamped indicator values that sync with candles
 */
function mergeIndicatorData(
  gpuData: IndicatorData[],
  wsHistory: LiveIndicators[],
  candles: Candle[]
): IndicatorData[] {
  if (wsHistory.length === 0) {
    return gpuData
  }

  // Create a map of candle timestamp -> index
  const candleIndexMap = new Map<number, number>()
  candles.forEach((c, idx) => candleIndexMap.set(c.t, idx))

  // DEBUG: Log timestamp matching
  if (wsHistory.length > 0) {
    const lastWs = wsHistory[wsHistory.length - 1]
    const lastCandle = candles[candles.length - 1]
    const matchedIndex = candleIndexMap.get(lastWs.t)
    console.log('[mergeIndicatorData] DEBUG:', {
      wsTimestamp: lastWs.t,
      wsDate: new Date(lastWs.t).toISOString(),
      wsValues: lastWs.values,
      lastCandleTimestamp: lastCandle?.t,
      lastCandleDate: lastCandle ? new Date(lastCandle.t).toISOString() : null,
      matchedIndex,
      candleCount: candles.length,
      wsHistoryCount: wsHistory.length,
    })
  }

  // Create merged data
  const mergedData: IndicatorData[] = []

  // Get all indicator names from both sources
  const indicatorNames = new Set<string>()
  gpuData.forEach(d => indicatorNames.add(d.name))
  wsHistory.forEach(ws => {
    Object.keys(ws.values).forEach(name => indicatorNames.add(name.toUpperCase()))
  })

  for (const name of indicatorNames) {
    // Start with GPU data
    const gpuIndicator = gpuData.find(d => d.name === name)
    const valuesMap = new Map<number, number>()

    // Add GPU values
    if (gpuIndicator) {
      gpuIndicator.values.forEach(v => valuesMap.set(v.index, v.value))
    }

    // Override/add WebSocket values (real-time, synced with candles)
    for (const ws of wsHistory) {
      const candleIndex = candleIndexMap.get(ws.t)
      if (candleIndex !== undefined) {
        // Find matching indicator in WebSocket data
        const wsKey = Object.keys(ws.values).find(
          k => k.toUpperCase() === name || normalizeIndicatorName(k).toUpperCase() === name
        )
        if (wsKey && ws.values[wsKey] !== undefined) {
          valuesMap.set(candleIndex, ws.values[wsKey])
        }
      }
    }

    // Convert map to sorted array
    const values = Array.from(valuesMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([index, value]) => ({ index, value }))

    if (values.length > 0) {
      mergedData.push({ name, values })
    }
  }

  return mergedData
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
  const [historicalTrades, setHistoricalTrades] = useState<RecentTrade[]>([])
  const [isWarmingUp, setIsWarmingUp] = useState(true)

  // GPU-calculated indicator data for chart (historical)
  const [gpuIndicatorData, setGpuIndicatorData] = useState<IndicatorData[]>([])
  const indicatorCalcPending = useRef(false)

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

  // WebSocket hook - now includes indicatorsHistory
  const {
    connectionStatus,
    isConnected,
    latencyMs,
    candles: liveCandles,
    indicators,
    indicatorsHistory,
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

  // Merge historical + live candles
  const chartCandles: Candle[] = useMemo(() => {
    // Start with historical candles
    const merged = [...historicalCandles]

    // Add/update live candles
    for (const live of liveCandles) {
      const existingIdx = merged.findIndex(c => c.t === live.t)
      if (existingIdx >= 0) {
        // Update existing candle (same timestamp)
        merged[existingIdx] = live
      } else if (merged.length === 0 || live.t > merged[merged.length - 1].t) {
        // Append new candle
        merged.push(live)
      }
    }

    // Sort by timestamp and limit to max candles
    merged.sort((a, b) => a.t - b.t)

    return merged.slice(-500)
  }, [historicalCandles, liveCandles])

  // GPU-accelerated indicator calculation (for historical data)
  useEffect(() => {
    if (chartCandles.length < 50 || indicatorCalcPending.current) {
      return
    }

    // Parse indicator configs from strategy
    const indicatorConfigs = parseIndicatorConfigs(config.indicatorNames)

    if (Object.keys(indicatorConfigs).length === 0) {
      console.log('[GPU] No indicators to calculate')
      return
    }

    indicatorCalcPending.current = true

    // Calculate indicators using GPU
    const startTime = performance.now()

    calculateAllIndicators(chartCandles, indicatorConfigs)
      .then(results => {
        const elapsed = performance.now() - startTime
        console.log(`[GPU] Calculated ${Object.keys(results).length} indicators in ${elapsed.toFixed(2)}ms`)

        const data = transformToIndicatorData(results, indicatorConfigs)
        setGpuIndicatorData(data)
      })
      .catch(err => {
        console.error('[GPU] Indicator calculation failed:', err)
      })
      .finally(() => {
        indicatorCalcPending.current = false
      })
  }, [chartCandles, config.indicatorNames])

  // Merge GPU + WebSocket indicators for real-time sync
  const indicatorData: IndicatorData[] = useMemo(() => {
    return mergeIndicatorData(gpuIndicatorData, indicatorsHistory, chartCandles)
  }, [gpuIndicatorData, indicatorsHistory, chartCandles])

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
 *
 * @param deploymentId - Deployment UUID
 * @param strategyId - Architect strategy UUID
 * @param strategyName - Strategy name (from validated data)
 * @param validatedData - Data from TSDL /data/all endpoint
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
  // Normalize indicators for GPU calculation
  const indicatorNames = validatedData.indicators.map(normalizeIndicatorName)

  console.log('[buildStrategyConfig] Built from validated data:', {
    raw: validatedData.indicators,
    normalized: indicatorNames,
  })

  return {
    deploymentId,
    strategyId,
    strategyName,
    symbol: validatedData.symbol,
    timeframe: validatedData.timeframe,
    indicatorNames,
  }
}
