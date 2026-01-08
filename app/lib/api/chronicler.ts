/**
 * Chronicler API Client
 * Market data service for Solana tokens
 */

import { getAuthToken } from './client'
import { logger, LogCategory } from '@/lib/debug'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

// ============================================================================
// TYPES
// ============================================================================

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logo_uri: string
}

export type TokensResponse = Token[]

export interface ChroniclerCandle {
  token_address: string
  timestamp: string
  timeframe: string
  open: string
  high: string
  low: string
  close: string
  volume: string
  trades_count: number
}

export interface OHLCVResponse {
  candles: ChroniclerCandle[]
}

// ============================================================================
// TOKEN ADDRESS MAPPING
// ============================================================================

// Common token addresses for symbol lookup
export const TOKEN_ADDRESSES: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'SOL/USDC': 'So11111111111111111111111111111111111111112',
  'SOL/USD': 'So11111111111111111111111111111111111111112',
}

/**
 * Get token address from symbol
 */
export function getTokenAddress(symbol: string): string {
  // Try direct lookup
  if (TOKEN_ADDRESSES[symbol]) {
    return TOKEN_ADDRESSES[symbol]
  }

  // Try base token (e.g., "SOL/USDC" -> "SOL")
  const baseToken = symbol.split('/')[0]
  if (TOKEN_ADDRESSES[baseToken]) {
    return TOKEN_ADDRESSES[baseToken]
  }

  // Return as-is if it looks like an address
  if (symbol.length > 30) {
    return symbol
  }

  // Default to SOL
  console.warn(`Unknown token symbol: ${symbol}, defaulting to SOL`)
  return TOKEN_ADDRESSES['SOL']
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch available tokens from Chronicler
 */
export const getTokens = async (): Promise<TokensResponse> => {
  logger.debug(LogCategory.API, 'Fetching available tokens')

  try {
    const token = getAuthToken()
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/chronicler/tokens`, { headers })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const result = await response.json()
    logger.info(LogCategory.API, 'Tokens fetched', { count: result.length })
    return result
  } catch (error) {
    logger.error(LogCategory.API, 'Failed to fetch tokens', { error })
    throw error
  }
}

/**
 * Fetch historical OHLCV candles from Chronicler
 *
 * @param tokenAddress - Solana token address (e.g., SOL mint address)
 * @param timeframe - Candle timeframe (1m, 5m, 15m, 1h, 4h, 1d)
 * @param startTime - Start time ISO string
 * @param endTime - End time ISO string
 */
export async function fetchOHLCV(
  tokenAddress: string,
  timeframe: string,
  startTime: string,
  endTime: string
): Promise<ChroniclerCandle[]> {
  const params = new URLSearchParams({
    token_address: tokenAddress,
    timeframe: timeframe,
    start_time: startTime,
    end_time: endTime,
  })

  const token = getAuthToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  logger.debug(LogCategory.API, 'Fetching OHLCV', { tokenAddress, timeframe, startTime, endTime })

  const response = await fetch(
    `${API_URL}/chronicler/ohlcv?${params.toString()}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error(`Chronicler error: ${response.status} ${response.statusText}`)
  }

  const data: OHLCVResponse = await response.json()
  logger.info(LogCategory.API, 'OHLCV fetched', { count: data.candles.length })
  return data.candles
}

/**
 * Calculate hours needed for target candle count based on timeframe
 */
export function calculateWarmupHours(timeframe: string, targetCandles: number = 500): number {
  const tfMinutes: Record<string, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
  }
  const minutes = tfMinutes[timeframe] || 60
  return Math.ceil((targetCandles * minutes) / 60)
}

/**
 * Fetch warm-up candles for chart initialization
 *
 * @param symbol - Trading pair symbol (e.g., "SOL/USDC")
 * @param timeframe - Candle timeframe
 * @param targetCandles - Number of candles to fetch (default 500)
 */
export async function fetchWarmupCandles(
  symbol: string,
  timeframe: string,
  targetCandles: number = 500
): Promise<ChroniclerCandle[]> {
  const tokenAddress = getTokenAddress(symbol)
  const hours = calculateWarmupHours(timeframe, targetCandles)
  const endTime = new Date().toISOString()
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  return fetchOHLCV(tokenAddress, timeframe, startTime, endTime)
}
