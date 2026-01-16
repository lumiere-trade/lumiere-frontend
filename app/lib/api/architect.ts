/**
 * Architect API Client
 * Strategy management
 * NOW: Communicates through Pourtier proxy (/api/architect/*)
 */

import { get, post, patch, del } from './client';
import { logger, LogCategory } from '@/lib/debug';

// ============================================================================
// TYPES
// ============================================================================

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  tsdl_code: string;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyRequest {
  name: string;
  tsdl_code: string;
  version: string;
}

export interface UpdateStrategyRequest {
  name?: string;
  tsdl_code?: string;
}

export interface StrategyListResponse {
  strategies: Strategy[];
  total: number;
  limit: number;
  offset: number;
}

// Library Types
export interface LibraryCategory {
  value: string;
  display_name: string;
}

export interface LibraryStrategy {
  id: string;
  name: string;
  category: string;
}

export interface EducationalContent {
  concept?: string;
  entry_logic?: string;
  exit_logic?: string;
  risk_reward?: string;
  philosophy?: string;
}

export interface LibraryStrategyDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  symbol: string;
  timeframe: string;
  indicators: string[];
  entry_rules: string[];
  entry_logic: string;
  exit_rules: string[];
  exit_logic: string;
  parameters: Record<string, any>;
  educational_content?: EducationalContent;
}

// ============================================================================
// STRATEGY API (through Pourtier proxy)
// ============================================================================

const ARCHITECT_PREFIX = '/api/architect';
const LOG_CATEGORY = LogCategory.API;

/**
 * Create a new strategy
 */
export const createStrategy = async (
  data: CreateStrategyRequest
): Promise<Strategy> => {
  logger.info(LOG_CATEGORY, 'Creating strategy', { name: data.name });

  try {
    const result = await post(`${ARCHITECT_PREFIX}/strategies`, data);
    logger.info(LOG_CATEGORY, 'Strategy created successfully', { strategy_id: result.id });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to create strategy', { error, name: data.name });
    throw error;
  }
};

/**
 * Get all strategies for current user
 */
export const getStrategies = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<StrategyListResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching strategies', params);

  try {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const queryString = query.toString();
    const endpoint = queryString
      ? `${ARCHITECT_PREFIX}/strategies?${queryString}`
      : `${ARCHITECT_PREFIX}/strategies`;

    const result = await get(endpoint);
    logger.info(LOG_CATEGORY, 'Strategies fetched', { count: result.total, params });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch strategies', { error, params });
    throw error;
  }
};

/**
 * Get single strategy by ID
 */
export const getStrategy = async (strategyId: string): Promise<Strategy> => {
  logger.debug(LOG_CATEGORY, 'Fetching strategy', { strategyId });

  try {
    const result = await get(`${ARCHITECT_PREFIX}/strategies/${strategyId}`);
    logger.info(LOG_CATEGORY, 'Strategy fetched', { strategyId, name: result.name });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch strategy', { error, strategyId });
    throw error;
  }
};

/**
 * Update strategy
 */
export const updateStrategy = async (
  strategyId: string,
  updates: UpdateStrategyRequest
): Promise<Strategy> => {
  logger.info(LOG_CATEGORY, 'Updating strategy', { strategyId, updates });

  try {
    const result = await patch(`${ARCHITECT_PREFIX}/strategies/${strategyId}`, updates);
    logger.info(LOG_CATEGORY, 'Strategy updated successfully', { strategyId });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to update strategy', { error, strategyId });
    throw error;
  }
};

/**
 * Delete strategy
 */
export const deleteStrategy = async (strategyId: string): Promise<void> => {
  logger.info(LOG_CATEGORY, 'Deleting strategy', { strategyId });

  try {
    await del(`${ARCHITECT_PREFIX}/strategies/${strategyId}`);
    logger.info(LOG_CATEGORY, 'Strategy deleted successfully', { strategyId });
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to delete strategy', { error, strategyId });
    throw error;
  }
};

/**

// ============================================================================
// LIBRARY API (through Pourtier proxy)
// ============================================================================

/**
 * Get available library categories
 */
export const getLibraryCategories = async (): Promise<LibraryCategory[]> => {
  logger.debug(LOG_CATEGORY, 'Fetching library categories');

  try {
    const result = await get(`${ARCHITECT_PREFIX}/library/categories`);
    logger.info(LOG_CATEGORY, 'Library categories fetched', { count: result.length });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch library categories', { error });
    throw error;
  }
};

/**
 * Get library strategies
 */
export const getLibraryStrategies = async (params?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<LibraryStrategy[]> => {
  logger.debug(LOG_CATEGORY, 'Fetching library strategies', params);

  try {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const queryString = query.toString();
    const endpoint = queryString
      ? `${ARCHITECT_PREFIX}/library/strategies?${queryString}`
      : `${ARCHITECT_PREFIX}/library/strategies`;

    const result = await get(endpoint);
    logger.info(LOG_CATEGORY, 'Library strategies fetched', { count: result.length, params });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch library strategies', { error, params });
    throw error;
  }
};

/**
 * Get library strategy detail
 */
export const getLibraryStrategy = async (
  strategyId: string
): Promise<LibraryStrategyDetail> => {
  logger.debug(LOG_CATEGORY, 'Fetching library strategy', { strategyId });

  try {
    const result = await get(`${ARCHITECT_PREFIX}/library/strategies/${strategyId}`);
    logger.info(LOG_CATEGORY, 'Library strategy fetched', { strategyId, name: result.name });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch library strategy', { error, strategyId });
    throw error;
  }
};

/**
 * Search library strategies
 */
export const searchLibraryStrategies = async (
  query: string,
  limit?: number
): Promise<LibraryStrategy[]> => {
  logger.debug(LOG_CATEGORY, 'Searching library strategies', { query, limit });

  try {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());

    const result = await get(`${ARCHITECT_PREFIX}/library/strategies/search?${params.toString()}`);
    logger.info(LOG_CATEGORY, 'Library search completed', { query, count: result.length });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to search library strategies', { error, query });
    throw error;
  }
};

/**
 * Compile strategy JSON to Python code
 */
export const compileStrategy = async (
  strategyJson: Record<string, any>
): Promise<{
  compiles: boolean
  python_code?: string
  strategy_class_name?: string
  compile_error?: string
}> => {
  logger.debug(LOG_CATEGORY, 'Compiling strategy', { name: strategyJson.name })

  try {
    const result = await post(`${ARCHITECT_PREFIX}/strategies/compile`, {
      strategy_json: strategyJson
    })

    if (result.compiles) {
      logger.info(LOG_CATEGORY, 'Strategy compiled successfully', {
        className: result.strategy_class_name
      })
    } else {
      logger.warn(LOG_CATEGORY, 'Strategy compilation failed', {
        error: result.compile_error
      })
    }

    return result
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to compile strategy', { error })
    throw error
  }
}
