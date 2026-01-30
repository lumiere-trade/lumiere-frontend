/**
 * Chevalier API Client
 * Live trading execution service
 * Communicates through Pourtier proxy (/api/chevalier/*)
 */

import { post, get, ApiError } from './client';
import { logger, LogCategory } from '@/lib/debug';
import type {
  StrategyStatus,
  DeploymentStatusResponse,
  DeploymentHistoryResponse
} from './types';

// ============================================================================
// TYPES (Aligned with Backend DTOs)
// ============================================================================

export interface DeployStrategyRequest {
  strategy_id: string;
  user_id: string;
  strategy_json: Record<string, any>;
  initial_capital: number;
  is_paper_trading: boolean;
}

export interface DeployStrategyResponse {
  deployment_id: string;
  architect_strategy_id: string;
  version: number;
  status: StrategyStatus;
  created_at: string;
  is_paper_trading: boolean;
}

export interface StrategyActionResponse {
  status: string;
  deployment_id: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface TradeResponse {
  id: string;
  deployment_id: string;
  architect_strategy_id: string;
  version: number;
  user_id: string;
  symbol: string;
  signal_type: 'ENTRY' | 'EXIT';
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  total_value: string;
  realized_pnl: string | null;
  realized_pnl_pct: string | null;
  reason: string | null;
  executed_at: string;
  indicators: Record<string, number> | null;
}

export interface TradesListResponse {
  deployment_id: string;
  trades: TradeResponse[];
  total_count: number;
}

export interface IndicatorHistoryItem {
  timestamp: string;
  values: Record<string, number>;
}

export interface IndicatorsHistoryResponse {
  indicators: IndicatorHistoryItem[];
}

// Re-export for convenience
export type { StrategyStatus, DeploymentStatusResponse } from './types';

// ============================================================================
// CHEVALIER API (through Pourtier proxy)
// ============================================================================

const CHEVALIER_PREFIX = '/api/chevalier';
const LOG_CATEGORY = LogCategory.API;

/**
 * Deploy strategy for live trading
 *
 * Creates a new deployment instance with versioning.
 * Only ONE active deployment per architect_strategy_id allowed.
 */
export const deployStrategy = async (
  request: DeployStrategyRequest
): Promise<DeployStrategyResponse> => {
  logger.info(LOG_CATEGORY, 'Deploying strategy', {
    strategyId: request.strategy_id,
    isPaperTrading: request.is_paper_trading
  });

  try {
    const result = await post<DeployStrategyResponse>(
      `${CHEVALIER_PREFIX}/strategies/deploy`,
      request
    );

    logger.info(LOG_CATEGORY, 'Strategy deployed successfully', {
      deploymentId: result.deployment_id,
      version: result.version,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to deploy strategy', { error });
    throw error;
  }
};

/**
 * Pause running deployment
 *
 * Stops signal evaluation but keeps subscriptions active.
 * Can be resumed later without re-warmup.
 */
export const pauseDeployment = async (
  deploymentId: string
): Promise<StrategyActionResponse> => {
  logger.info(LOG_CATEGORY, 'Pausing deployment', { deploymentId });

  try {
    const result = await post<StrategyActionResponse>(
      `${CHEVALIER_PREFIX}/strategies/deployments/${deploymentId}/pause`
    );

    logger.info(LOG_CATEGORY, 'Deployment paused successfully', {
      deploymentId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to pause deployment', {
      error,
      deploymentId
    });
    throw error;
  }
};

/**
 * Resume paused deployment
 *
 * Restores indicator state and restarts evaluation.
 */
export const resumeDeployment = async (
  deploymentId: string
): Promise<StrategyActionResponse> => {
  logger.info(LOG_CATEGORY, 'Resuming deployment', { deploymentId });

  try {
    const result = await post<StrategyActionResponse>(
      `${CHEVALIER_PREFIX}/strategies/deployments/${deploymentId}/resume`
    );

    logger.info(LOG_CATEGORY, 'Deployment resumed successfully', {
      deploymentId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to resume deployment', {
      error,
      deploymentId
    });
    throw error;
  }
};

/**
 * Stop deployment permanently
 *
 * Closes any open positions and marks deployment as stopped.
 * Deployment can be undeployed after stopping.
 */
export const stopDeployment = async (
  deploymentId: string
): Promise<StrategyActionResponse> => {
  logger.info(LOG_CATEGORY, 'Stopping deployment', { deploymentId });

  try {
    const result = await post<StrategyActionResponse>(
      `${CHEVALIER_PREFIX}/strategies/deployments/${deploymentId}/stop`
    );

    logger.info(LOG_CATEGORY, 'Deployment stopped successfully', {
      deploymentId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to stop deployment', {
      error,
      deploymentId
    });
    throw error;
  }
};

/**
 * Undeploy (archive) deployment
 *
 * Final lifecycle action - deployment moves to UNDEPLOYED status.
 * Requires deployment to be STOPPED first.
 */
export const undeployDeployment = async (
  deploymentId: string
): Promise<StrategyActionResponse> => {
  logger.info(LOG_CATEGORY, 'Undeploying deployment', { deploymentId });

  try {
    const result = await post<StrategyActionResponse>(
      `${CHEVALIER_PREFIX}/strategies/deployments/${deploymentId}/undeploy`
    );

    logger.info(LOG_CATEGORY, 'Deployment undeployed successfully', {
      deploymentId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to undeploy deployment', {
      error,
      deploymentId
    });
    throw error;
  }
};

/**
 * Get active deployment for specific Architect strategy
 *
 * Returns 404 if no active deployment exists.
 */
export const getActiveDeployment = async (
  architectStrategyId: string
): Promise<DeploymentStatusResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching active deployment', { architectStrategyId });

  try {
    const result = await get<DeploymentStatusResponse>(
      `${CHEVALIER_PREFIX}/strategies/${architectStrategyId}/active`
    );

    logger.debug(LOG_CATEGORY, 'Active deployment fetched', {
      deploymentId: result.deployment_id,
      status: result.status,
    });

    return result;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      logger.debug(LOG_CATEGORY, 'No active deployment', { architectStrategyId });
    } else {
      logger.error(LOG_CATEGORY, 'Failed to fetch active deployment', {
        error,
        architectStrategyId
      });
    }
    throw error;
  }
};

/**
 * Get deployment by deployment instance ID
 */
export const getDeploymentStatus = async (
  deploymentId: string
): Promise<DeploymentStatusResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching deployment status', { deploymentId });

  try {
    const result = await get<DeploymentStatusResponse>(
      `${CHEVALIER_PREFIX}/strategies/deployments/${deploymentId}`
    );

    logger.debug(LOG_CATEGORY, 'Deployment status fetched', {
      deploymentId,
      status: result.status,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch deployment status', {
      error,
      deploymentId
    });
    throw error;
  }
};

/**
 * Get trades for deployment
 *
 * Returns all trades executed by this deployment instance,
 * ordered by execution time (newest first).
 */
export const getDeploymentTrades = async (
  deploymentId: string,
  limit: number = 100
): Promise<TradesListResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching deployment trades', { deploymentId, limit });

  try {
    const result = await get<TradesListResponse>(
      `${CHEVALIER_PREFIX}/strategies/deployments/${deploymentId}/trades?limit=${limit}`
    );

    logger.debug(LOG_CATEGORY, 'Deployment trades fetched', {
      deploymentId,
      count: result.total_count,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch deployment trades', {
      error,
      deploymentId
    });
    throw error;
  }
};

/**
 * Get historical indicator values for deployment
 *
 * Frontend calls this on mount to populate indicator charts with history.
 * Returns calculated indicators for last N candles.
 */
export const getIndicatorsHistory = async (
  deploymentId: string,
  last: number = 200
): Promise<IndicatorsHistoryResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching indicators history', { deploymentId, last });

  try {
    const result = await get<IndicatorsHistoryResponse>(
      `${CHEVALIER_PREFIX}/strategies/deployments/${deploymentId}/indicators/history?last=${last}`
    );

    logger.debug(LOG_CATEGORY, 'Indicators history fetched', {
      deploymentId,
      count: result.indicators.length,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch indicators history', {
      error,
      deploymentId
    });
    throw error;
  }
};

/**
 * Get deployment history for Architect strategy
 */
export const getDeploymentHistory = async (
  architectStrategyId: string
): Promise<DeploymentHistoryResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching deployment history', { architectStrategyId });

  try {
    const result = await get<DeploymentHistoryResponse>(
      `${CHEVALIER_PREFIX}/strategies/${architectStrategyId}/history`
    );

    logger.debug(LOG_CATEGORY, 'Deployment history fetched', {
      architectStrategyId,
      count: result.deployments.length,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch deployment history', {
      error,
      architectStrategyId
    });
    throw error;
  }
};

/**
 * Get all active deployments (optionally filtered by user)
 */
export const getActiveDeployments = async (
  userId?: string
): Promise<DeploymentStatusResponse[]> => {
  logger.debug(LOG_CATEGORY, 'Fetching active deployments', { userId });

  try {
    const url = userId
      ? `${CHEVALIER_PREFIX}/strategies/deployments/active?user_id=${userId}`
      : `${CHEVALIER_PREFIX}/strategies/deployments/active`;

    const result = await get<DeploymentStatusResponse[]>(url);

    logger.info(LOG_CATEGORY, 'Active deployments fetched', {
      count: result.length,
    });

    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch active deployments', { error });
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

// ============================================================================
// LEGACY EXPORTS (for backward compatibility during migration)
// ============================================================================

export const pauseStrategy = pauseDeployment;
export const resumeStrategy = resumeDeployment;
export const stopStrategy = stopDeployment;
export const undeployStrategy = undeployDeployment;
export const getStrategyStatus = getActiveDeployment;
export const getActiveStrategies = getActiveDeployments;
