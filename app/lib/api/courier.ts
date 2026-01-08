/**
 * Courier WebSocket Types and Utilities
 * Real-time dashboard streaming via Courier event bus
 */

// ============================================================================
// MESSAGE TYPES (from Chevalier -> Courier -> Frontend)
// ============================================================================

export interface DashboardCandle {
  type: 'dashboard.candle'
  deployment_id: string
  token_symbol: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface DashboardIndicators {
  type: 'dashboard.indicators'
  deployment_id: string
  values: Record<string, number>  // e.g., { "rsi_16": 52.55, "ema_20": 135.50 }
}

export interface DashboardPosition {
  type: 'dashboard.position'
  deployment_id: string
  has_position: boolean
  entry_price: number
  current_price: number
  size: number
  unrealized_pnl: number
  cash_balance: number
  total_equity: number
  realized_pnl: number
  total_trades: number
}

export interface DashboardSignal {
  type: 'dashboard.signal'
  deployment_id: string
  signal_type: 'ENTRY' | 'EXIT'
  price: number
  reasons: string[]
  indicators: Record<string, number>
  timestamp?: string
}

export interface DashboardError {
  type: 'dashboard.error'
  deployment_id: string
  failure_count: number
  last_error: string
}

export type DashboardMessage =
  | DashboardCandle
  | DashboardIndicators
  | DashboardPosition
  | DashboardSignal
  | DashboardError

// ============================================================================
// CONNECTION STATE
// ============================================================================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ConnectionStatus {
  state: ConnectionState
  lastConnectedAt: Date | null
  lastMessageAt: Date | null
  reconnectAttempts: number
  error: string | null
}

// ============================================================================
// TRANSFORMED TYPES (for UI components)
// ============================================================================

export interface LiveCandle {
  t: number   // timestamp as unix ms
  o: number   // open
  h: number   // high
  l: number   // low
  c: number   // close
  v: number   // volume
}

export interface LivePosition {
  hasPosition: boolean
  side: 'LONG' | 'SHORT' | null
  entryPrice: number
  currentPrice: number
  size: number
  value: number
  unrealizedPnL: number
  unrealizedPnLPct: number
  cashBalance: number
  totalEquity: number
  realizedPnL: number
  totalTrades: number
}

export interface LiveSignal {
  id: string
  type: 'ENTRY' | 'EXIT'
  price: number
  reasons: string[]
  indicators: Record<string, number>
  timestamp: Date
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transform DashboardCandle to chart-compatible format
 */
export function transformCandle(msg: DashboardCandle): LiveCandle {
  return {
    t: new Date(msg.timestamp).getTime(),
    o: msg.open,
    h: msg.high,
    l: msg.low,
    c: msg.close,
    v: msg.volume,
  }
}

/**
 * Transform DashboardPosition to UI-compatible format
 */
export function transformPosition(msg: DashboardPosition): LivePosition {
  const value = msg.size * msg.current_price
  const pnlPct = msg.entry_price > 0
    ? ((msg.current_price - msg.entry_price) / msg.entry_price) * 100
    : 0

  return {
    hasPosition: msg.has_position,
    side: msg.has_position ? 'LONG' : null,  // Assuming long-only for now
    entryPrice: msg.entry_price,
    currentPrice: msg.current_price,
    size: msg.size,
    value,
    unrealizedPnL: msg.unrealized_pnl,
    unrealizedPnLPct: pnlPct,
    cashBalance: msg.cash_balance,
    totalEquity: msg.total_equity,
    realizedPnL: msg.realized_pnl,
    totalTrades: msg.total_trades,
  }
}

/**
 * Transform DashboardSignal to UI-compatible format
 */
export function transformSignal(msg: DashboardSignal): LiveSignal {
  return {
    id: `${msg.deployment_id}-${msg.signal_type}-${Date.now()}`,
    type: msg.signal_type,
    price: msg.price,
    reasons: msg.reasons,
    indicators: msg.indicators,
    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
  }
}

/**
 * Build WebSocket URL for dashboard channel
 * 
 * Production (Vercel): wss://api.lumiere.trade/courier/ws/dashboard.{user_id}
 * Development (local): ws://localhost:9765/ws/dashboard.{user_id}
 */
export function buildDashboardWsUrl(
  baseUrl: string,
  userId: string,
  token?: string
): string {
  // Detect if production (wss://) or development (ws://)
  const isProduction = baseUrl.startsWith('wss://')
  
  // Production uses /courier/ws/ path (nginx proxy)
  // Development connects directly to Courier on /ws/
  const wsPath = isProduction ? '/courier/ws' : '/ws'
  
  const url = `${baseUrl}${wsPath}/dashboard.${userId}`
  return token ? `${url}?token=${token}` : url
}

/**
 * Parse incoming WebSocket message
 */
export function parseMessage(data: string): DashboardMessage | null {
  try {
    const parsed = JSON.parse(data)
    
    // Validate message has type field
    if (!parsed.type || !parsed.type.startsWith('dashboard.')) {
      console.warn('[Courier] Unknown message type:', parsed.type)
      return null
    }
    
    return parsed as DashboardMessage
  } catch (error) {
    console.error('[Courier] Failed to parse message:', error)
    return null
  }
}
