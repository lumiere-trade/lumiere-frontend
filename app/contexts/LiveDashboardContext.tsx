/**
 * Live Dashboard Context
 * Provides real-time trading data via WebSocket to LiveDashboard components
 * Includes historical candle warm-up from Chronicler
 * GPU-accelerated indicator calculation
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
import { calculateAllIndicators, type IndicatorResults } from '@/lib/gpu'
import type {
  ConnectionStatus,
  LiveCandle,
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
  
  // Indicator data for chart (GPU-calculated)
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
 * Parse indicator configs from strategy indicator names
 */
function parseIndicatorConfigs(
  indicatorNames: string[]
): Record<string, { type: string; params?: number[] }> {
  const configs: Record<string, { type: string; params?: number[] }> = {}
  
  for (const name of indicatorNames) {
    // Parse names like "rsi_16", "ema_20", "macd_12_26_9"
    const parts = name.toLowerCase().split('_')
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
  const [isWarmingUp, setIsWarmingUp] = useState(true)
  
  // GPU-calculated indicator data for chart
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([])
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

  // GPU-accelerated indicator calculation
  useEffect(() => {
    if (chartCandles.length < 50 || indicatorCalcPending.current) {
      return
    }
    
    // Parse indicator configs from strategy
    const indicatorConfigs = parseIndicatorConfigs(config.indicatorNames)
    
    if (Object.keys(indicatorConfigs).length === 0) {
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
        setIndicatorData(data)
      })
      .catch(err => {
        console.error('[GPU] Indicator calculation failed:', err)
      })
      .finally(() => {
        indicatorCalcPending.current = false
      })
  }, [chartCandles, config.indicatorNames])

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
