/**
 * Chevalier API Client
 * Live trading execution service
 * Communicates through Pourtier proxy (/api/chevalier/*)
 */

import { post, get } from './client';
import { logger, LogCategory } from '@/lib/debug';

// ============================================================================
// TYPES (Aligned with Backend DTOs)
// ============================================================================

export interface DeployStrategyRequest {
  user_id: string;
  strategy_json: Record<string, any>;
  initial_capital: number;
  is_paper_trading: boolean;
}

export interface DeployStrategyResponse {
  strategy_id: string;
  status: string;
  created_at: string;
  is_paper_trading: boolean;
}

export interface StrategyStatusResponse {
  strategy_id: string;
  status: string;
  user_id: string;
  token_symbol: string;
  current_capital: number;
  is_paper_trading: boolean;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

// ============================================================================
// CHEVALIER API (through Pourtier proxy)
// ============================================================================

const CHEVALIER_PREFIX = '/api/chevalier';
const LOG_CATEGORY = LogCategory.API;

/**
 * Deploy strategy for live trading
 *
 * Creates a new deployed strategy and starts execution immediately.
 * Strategy is immutable once deployed - any changes require new deployment.
 */
export const deployStrategy = async (
  request: DeployStrategyRequest
): Promise<DeployStrategyResponse> => {
  logger.info(LOG_CATEGORY, 'Deploying strategy', { request });

  try {
    const result = await post<DeployStrategyResponse>(
      `${CHEVALIER_PREFIX}/strategies/deploy`,
      request
    );

    logger.info(LOG_CATEGORY, 'Strategy deployed successfully', {
      strategyId: result.strategy_id,
      status: result.status,
      isPaperTrading: result.is_paper_trading,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to deploy strategy', { error });
    throw error;
  }
};

/**
 * Pause running strategy
 *
 * Stops signal evaluation but keeps subscriptions active.
 * Can be resumed later without re-warmup.
 */
export const pauseStrategy = async (
  strategyId: string
): Promise<{ status: string; strategy_id: string }> => {
  logger.info(LOG_CATEGORY, 'Pausing strategy', { strategyId });

  try {
    const result = await post<{ status: string; strategy_id: string }>(
      `${CHEVALIER_PREFIX}/strategies/${strategyId}/pause`
    );

    logger.info(LOG_CATEGORY, 'Strategy paused successfully', {
      strategyId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to pause strategy', {
      error,
      strategyId
    });
    throw error;
  }
};

/**
 * Resume paused strategy
 *
 * Restores indicator state and restarts evaluation.
 */
export const resumeStrategy = async (
  strategyId: string
): Promise<{ status: string; strategy_id: string }> => {
  logger.info(LOG_CATEGORY, 'Resuming strategy', { strategyId });

  try {
    const result = await post<{ status: string; strategy_id: string }>(
      `${CHEVALIER_PREFIX}/strategies/${strategyId}/resume`
    );

    logger.info(LOG_CATEGORY, 'Strategy resumed successfully', {
      strategyId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to resume strategy', {
      error,
      strategyId
    });
    throw error;
  }
};

/**
 * Stop strategy permanently
 *
 * Cleanup: Unsubscribe, delete state, archive strategy.
 */
export const stopStrategy = async (
  strategyId: string
): Promise<{ status: string; strategy_id: string }> => {
  logger.info(LOG_CATEGORY, 'Stopping strategy', { strategyId });

  try {
    const result = await post<{ status: string; strategy_id: string }>(
      `${CHEVALIER_PREFIX}/strategies/${strategyId}/stop`
    );

    logger.info(LOG_CATEGORY, 'Strategy stopped successfully', {
      strategyId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to stop strategy', {
      error,
      strategyId
    });
    throw error;
  }
};

/**
 * Get strategy status
 * 
 * Note: 404 is a valid response (strategy not deployed)
 */
export const getStrategyStatus = async (
  strategyId: string
): Promise<StrategyStatusResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching strategy status', { strategyId });

  try {
    const result = await get<StrategyStatusResponse>(
      `${CHEVALIER_PREFIX}/strategies/${strategyId}`
    );

    logger.debug(LOG_CATEGORY, 'Strategy status fetched', {
      strategyId,
      status: result.status,
      currentCapital: result.current_capital,
    });

    return result;
  } catch (error: any) {
    // 404 is expected when strategy is not deployed - don't log as error
    if (error.response?.status === 404) {
      logger.debug(LOG_CATEGORY, 'Strategy not deployed', { strategyId });
    } else {
      logger.error(LOG_CATEGORY, 'Failed to fetch strategy status', {
        error,
        strategyId
      });
    }
    throw error;
  }
};

/**
 * Get all active strategies (optionally filtered by user)
 */
export const getActiveStrategies = async (
  userId?: string
): Promise<StrategyStatusResponse[]> => {
  logger.debug(LOG_CATEGORY, 'Fetching active strategies', { userId });

  try {
    const url = userId
      ? `${CHEVALIER_PREFIX}/strategies/active?user_id=${userId}`
      : `${CHEVALIER_PREFIX}/strategies/active`;

    const result = await get<StrategyStatusResponse[]>(url);

    logger.info(LOG_CATEGORY, 'Active strategies fetched', {
      count: result.length,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch active strategies', { error });
    throw error;
  }
};

/**
 * Check Chevalier service health
 */
export const getHealth = async (): Promise<HealthResponse> => {
  logger.debug(LOG_CATEGORY, 'Checking Chevalier health');

  try {
    const result = await get<HealthResponse>(`${CHEVALIER_PREFIX}/health`);

    logger.info(LOG_CATEGORY, 'Chevalier health check passed', {
      status: result.status,
      service: result.service,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Chevalier health check failed', { error });
    throw error;
  }
};
