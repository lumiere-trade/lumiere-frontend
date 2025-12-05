/**
 * Cartographe API Client
 * Backtesting service for TSDL strategies
 * Communicates through Pourtier proxy (/api/cartographe/*)
 */

import { post, get } from './client';
import { logger, LogCategory } from '@/lib/debug';

// ============================================================================
// TYPES
// ============================================================================

export interface BacktestRequest {
  tsdl_document: string;
  symbol: string;
  days_back: number;
  initial_capital: number;
  timeframe: string;
  slippage: number;
  commission: number;
  cache_results: boolean;
}

export interface BacktestMetrics {
  total_return: number;
  total_return_pct: number;
  final_equity: number;
  cagr: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  profit_factor: number;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  cash: number;
  positions_value: number;
  drawdown: number;
  return_pct: number;
}

export interface Trade {
  id: string;
  timestamp: string;
  side: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  quantity: number;
  value: number;
  commission: number;
  reason: string;
  pnl?: number | null;
  pnl_pct?: number | null;
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeAnalysis {
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  largest_loss: number;
  avg_holding_time_minutes: number;
  longest_winning_streak: number;
  longest_losing_streak: number;
}

export interface BacktestResponse {
  backtest_id: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  status: 'COMPLETED' | 'FAILED';
  metrics: BacktestMetrics;
  equity_curve: EquityPoint[];
  trades: Trade[];
  trade_analysis: TradeAnalysis;
  market_data: Candle[];
  execution_time_seconds?: number | null;
  error_message?: string | null;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

// ============================================================================
// CARTOGRAPHE API (through Pourtier proxy)
// ============================================================================

const CARTOGRAPHE_PREFIX = '/api/cartographe';
const LOG_CATEGORY = LogCategory.API;

/**
 * Run backtest on TSDL strategy
 * Timeout: 60 seconds (handled by Pourtier)
 */
export const runBacktest = async (
  request: BacktestRequest
): Promise<BacktestResponse> => {
  logger.info(LOG_CATEGORY, 'Running backtest', {
    symbol: request.symbol,
    days_back: request.days_back,
    timeframe: request.timeframe,
    initial_capital: request.initial_capital,
  });

  try {
    const result = await post(`${CARTOGRAPHE_PREFIX}/backtest`, request);
    logger.info(LOG_CATEGORY, 'Backtest completed successfully', {
      backtest_id: result.backtest_id,
      total_return: result.metrics.total_return_pct,
      total_trades: result.metrics.total_trades,
      win_rate: result.metrics.win_rate,
    });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to run backtest', {
      error,
      symbol: request.symbol,
      days_back: request.days_back,
    });
    throw error;
  }
};

/**
 * Check Cartographe service health
 */
export const getHealth = async (): Promise<HealthResponse> => {
  logger.debug(LOG_CATEGORY, 'Checking Cartographe health');

  try {
    const result = await get(`${CARTOGRAPHE_PREFIX}/health`);
    logger.info(LOG_CATEGORY, 'Cartographe health check passed', {
      status: result.status,
      version: result.version,
    });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Cartographe health check failed', { error });
    throw error;
  }
};
