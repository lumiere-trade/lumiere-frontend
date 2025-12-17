/**
 * Cartographe API Client
 * Backtesting service for JSON-based TSDL strategies
 * Communicates through Pourtier proxy (/api/cartographe/*)
 */

import { post, get, apiRequest } from './client';
import { logger, LogCategory } from '@/lib/debug';

// ============================================================================
// TYPES
// ============================================================================

export interface BacktestRequest {
  strategy_json: Record<string, any>;  // Strategy JSON from Prophet
  days_back: number;
  initial_capital: number;
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
const BACKTEST_TIMEOUT = 90000; // 90 seconds for backtest

/**
 * Run backtest on Strategy JSON
 * Timeout: 90 seconds (Cartographe can take up to 60s)
 */
export const runBacktest = async (
  request: BacktestRequest
): Promise<BacktestResponse> => {
  logger.info(LOG_CATEGORY, 'Running backtest', {
    strategy_name: request.strategy_json.name,
    symbol: request.strategy_json.symbol,
    days_back: request.days_back,
    timeframe: request.strategy_json.timeframe,
    initial_capital: request.initial_capital,
  });

  // Log strategy JSON for debugging
  console.log('Strategy JSON:', JSON.stringify(request.strategy_json, null, 2));

  try {
    const result = await apiRequest<BacktestResponse>(
      `${CARTOGRAPHE_PREFIX}/backtest`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      BACKTEST_TIMEOUT
    );

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
      strategy_name: request.strategy_json.name,
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
