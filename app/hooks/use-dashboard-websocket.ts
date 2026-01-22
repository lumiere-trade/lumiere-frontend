/**
 * Dashboard WebSocket Hook
 * Manages WebSocket connection to Courier for real-time dashboard data
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { COURIER_CONFIG } from '@/config/constants'
import { getAuthToken } from '@/lib/api/client'
import {
  type DashboardMessage,
  type DashboardCandle,
  type DashboardIndicators,
  type DashboardPosition,
  type DashboardSignal,
  type DashboardError,
  type ConnectionStatus,
  type ConnectionState,
  type LiveCandle,
  type LiveIndicators,
  type LivePosition,
  type LiveSignal,
  buildDashboardWsUrl,
  parseMessage,
  transformCandle,
  transformIndicators,
  transformPosition,
  transformSignal,
} from '@/lib/api/courier'

interface UseDashboardWebSocketOptions {
  userId: string
  deploymentId: string
  enabled?: boolean
  maxCandles?: number
  maxSignals?: number
}

interface UseDashboardWebSocketReturn {
  // Connection
  connectionStatus: ConnectionStatus
  isConnected: boolean
  latencyMs: number | null

  // Data
  candles: LiveCandle[]
  indicators: Record<string, number>
  indicatorsHistory: LiveIndicators[]  // New: timestamped history for chart sync
  position: LivePosition | null
  signals: LiveSignal[]
  error: DashboardError | null

  // Actions
  connect: () => void
  disconnect: () => void
}

export function useDashboardWebSocket({
  userId,
  deploymentId,
  enabled = true,
  maxCandles = 500,
  maxSignals = 50,
}: UseDashboardWebSocketOptions): UseDashboardWebSocketReturn {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: 'disconnected',
    lastConnectedAt: null,
    lastMessageAt: null,
    reconnectAttempts: 0,
    error: null,
  })
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  // Data state
  const [candles, setCandles] = useState<LiveCandle[]>([])
  const [indicators, setIndicators] = useState<Record<string, number>>({})
  const [indicatorsHistory, setIndicatorsHistory] = useState<LiveIndicators[]>([])
  const [position, setPosition] = useState<LivePosition | null>(null)
  const [signals, setSignals] = useState<LiveSignal[]>([])
  const [error, setError] = useState<DashboardError | null>(null)

  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPingRef = useRef<number>(0)
  const enabledRef = useRef(enabled)

  // Keep enabled ref in sync
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  // Message handler
  const handleMessage = useCallback((msg: DashboardMessage) => {
    // Filter by deployment_id
    if (msg.deployment_id !== deploymentId) {
      return
    }

    // Calculate latency from message timestamp
    if ('timestamp' in msg && msg.timestamp) {
      const msgTime = new Date(msg.timestamp).getTime()
      const now = Date.now()
      setLatencyMs(now - msgTime)
    }

    // Update last message time
    setConnectionStatus(prev => ({
      ...prev,
      lastMessageAt: new Date(),
    }))

    switch (msg.type) {
      case 'dashboard.candle':
        const newCandle = transformCandle(msg)
        setCandles(prev => {
          // Check if we should update last candle or add new one
          const lastCandle = prev[prev.length - 1]

          if (lastCandle && lastCandle.t === newCandle.t) {
            // Update existing candle (same timestamp)
            return [...prev.slice(0, -1), newCandle]
          } else {
            // Add new candle, trim if needed
            const updated = [...prev, newCandle]
            return updated.length > maxCandles
              ? updated.slice(-maxCandles)
              : updated
          }
        })
        break

      case 'dashboard.indicators':
        // Update current values (for indicator panel)
        setIndicators(msg.values)

        // Also store with timestamp for chart sync
        const newIndicators = transformIndicators(msg)
        setIndicatorsHistory(prev => {
          // Check if we should update last entry or add new one
          const lastEntry = prev[prev.length - 1]

          if (lastEntry && lastEntry.t === newIndicators.t) {
            // Update existing entry (same timestamp)
            return [...prev.slice(0, -1), newIndicators]
          } else {
            // Add new entry, trim if needed
            const updated = [...prev, newIndicators]
            return updated.length > maxCandles
              ? updated.slice(-maxCandles)
              : updated
          }
        })
        break

      case 'dashboard.position':
        setPosition(transformPosition(msg))
        break

      case 'dashboard.signal':
        const newSignal = transformSignal(msg)
        setSignals(prev => {
          const updated = [newSignal, ...prev]
          return updated.slice(0, maxSignals)
        })
        break

      case 'dashboard.error':
        setError(msg)
        break
    }
  }, [deploymentId, maxCandles, maxSignals])

  // Connect function
  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (!enabledRef.current || !userId) {
      return
    }

    const token = getAuthToken()
    const wsUrl = buildDashboardWsUrl(COURIER_CONFIG.WS_URL, userId, token || undefined)

    console.log('[WebSocket] Connecting to:', wsUrl.replace(/token=.*/, 'token=***'))

    setConnectionStatus(prev => ({
      ...prev,
      state: 'connecting',
      error: null,
    }))

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setConnectionStatus(prev => ({
          ...prev,
          state: 'connected',
          lastConnectedAt: new Date(),
          reconnectAttempts: 0,
          error: null,
        }))
        setError(null)
      }

      ws.onmessage = (event) => {
        const msg = parseMessage(event.data)
        if (msg) {
          handleMessage(msg)
        }
      }

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason)

        setConnectionStatus(prev => ({
          ...prev,
          state: 'disconnected',
        }))

        wsRef.current = null

        // Auto-reconnect if still enabled
        if (enabledRef.current) {
          setConnectionStatus(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }))

          console.log('[WebSocket] Reconnecting in', COURIER_CONFIG.RECONNECT_DELAY, 'ms')
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, COURIER_CONFIG.RECONNECT_DELAY)
        }
      }

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event)
        setConnectionStatus(prev => ({
          ...prev,
          state: 'error',
          error: 'WebSocket connection error',
        }))
      }

      wsRef.current = ws
    } catch (err) {
      console.error('[WebSocket] Failed to create connection:', err)
      setConnectionStatus(prev => ({
        ...prev,
        state: 'error',
        error: err instanceof Error ? err.message : 'Failed to connect',
      }))
    }
  }, [userId, handleMessage])

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting...')

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConnectionStatus(prev => ({
      ...prev,
      state: 'disconnected',
    }))
  }, [])

  // Auto-connect on mount / when enabled changes
  useEffect(() => {
    if (enabled && userId && deploymentId) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, userId, deploymentId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    connectionStatus,
    isConnected: connectionStatus.state === 'connected',
    latencyMs,
    candles,
    indicators,
    indicatorsHistory,
    position,
    signals,
    error,
    connect,
    disconnect,
  }
}
