/**
 * Chevalier API Client
 * Live trading execution service
 * Communicates through Pourtier proxy (/api/chevalier/*)
 */

import { post, get } from './client';
import { logger, LogCategory } from '@/lib/debug';

// ============================================================================
// TYPES
// ============================================================================

export interface DeployStrategyRequest {
  strategy_id: string;
}

export interface DeployStrategyResponse {
  execution_id: string;
  strategy_id: string;
  status: 'STARTING' | 'RUNNING';
  deployed_at: string;
  message: string;
}

export interface StopStrategyRequest {
  strategy_id: string;
}

export interface StopStrategyResponse {
  execution_id: string;
  strategy_id: string;
  status: 'STOPPING' | 'STOPPED';
  stopped_at: string;
  message: string;
}

export interface ExecutionStatus {
  execution_id: string;
  strategy_id: string;
  user_id: string;
  status: 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'ERROR';
  deployed_at: string;
  stopped_at: string | null;
  error_message: string | null;
  
  // Runtime stats
  signals_today: number;
  trades_today: number;
  pnl_today: number;
  last_signal_at: string | null;
  last_trade_at: string | null;
  
  // Resource usage
  cpu_percent: number | null;
  memory_mb: number | null;
  uptime_seconds: number | null;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  active_executions: number;
}

// ============================================================================
// CHEVALIER API (through Pourtier proxy)
// ============================================================================

const CHEVALIER_PREFIX = '/api/chevalier';
const LOG_CATEGORY = LogCategory.API;

/**
 * Deploy strategy for live trading
 */
export const deployStrategy = async (
  strategyId: string
): Promise<DeployStrategyResponse> => {
  logger.info(LOG_CATEGORY, 'Deploying strategy', { strategyId });

  try {
    const result = await post<DeployStrategyResponse>(
      `${CHEVALIER_PREFIX}/strategies/${strategyId}/deploy`
    );
    
    logger.info(LOG_CATEGORY, 'Strategy deployed successfully', {
      strategyId,
      executionId: result.execution_id,
      status: result.status,
    });
    
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to deploy strategy', { 
      error, 
      strategyId 
    });
    throw error;
  }
};

/**
 * Stop running strategy
 */
export const stopStrategy = async (
  strategyId: string
): Promise<StopStrategyResponse> => {
  logger.info(LOG_CATEGORY, 'Stopping strategy', { strategyId });

  try {
    const result = await post<StopStrategyResponse>(
      `${CHEVALIER_PREFIX}/strategies/${strategyId}/stop`
    );
    
    logger.info(LOG_CATEGORY, 'Strategy stopped successfully', {
      strategyId,
      executionId: result.execution_id,
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
 * Get strategy execution status
 */
export const getExecutionStatus = async (
  strategyId: string
): Promise<ExecutionStatus> => {
  logger.debug(LOG_CATEGORY, 'Fetching execution status', { strategyId });

  try {
    const result = await get<ExecutionStatus>(
      `${CHEVALIER_PREFIX}/strategies/${strategyId}/status`
    );
    
    logger.info(LOG_CATEGORY, 'Execution status fetched', {
      strategyId,
      status: result.status,
      signalsToday: result.signals_today,
      tradesToday: result.trades_today,
    });
    
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch execution status', { 
      error, 
      strategyId 
    });
    throw error;
  }
};

/**
 * Get all active executions for current user
 */
export const getActiveExecutions = async (): Promise<ExecutionStatus[]> => {
  logger.debug(LOG_CATEGORY, 'Fetching active executions');

  try {
    const result = await get<{ executions: ExecutionStatus[] }>(
      `${CHEVALIER_PREFIX}/executions/active`
    );
    
    logger.info(LOG_CATEGORY, 'Active executions fetched', {
      count: result.executions.length,
    });
    
    return result.executions;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch active executions', { error });
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
      version: result.version,
      activeExecutions: result.active_executions,
    });
    
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Chevalier health check failed', { error });
    throw error;
  }
};
