/**
 * Architect API Client
 * Strategy and Conversation management
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
  description: string;
  tsdl_code: string;
  version: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  base_plugins: string[];
  parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  strategy_id: string;
  state: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  message_count: number;
  duration_seconds: number | null;
  messages: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  token_count: number | null;
  conversation_state: string;
}

export interface CreateStrategyRequest {
  name: string;
  description: string;
  tsdl_code: string;
  version: string;
  base_plugins: string[];
  parameters: Record<string, any>;
}

export interface UpdateStrategyRequest {
  name?: string;
  description?: string;
  tsdl_code?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  parameters?: Record<string, any>;
}

export interface CreateConversationRequest {
  strategy_id: string;
  state: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    conversation_state: string;
    timestamp: string;
  }>;
}

export interface AddMessageRequest {
  role: 'user' | 'assistant' | 'system';
  content: string;
  conversation_state: string;
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
): Promise<{ strategy_id: string; created_at: string }> => {
  logger.info(LOG_CATEGORY, 'Creating strategy', { name: data.name, plugins: data.base_plugins });

  try {
    const result = await post(`${ARCHITECT_PREFIX}/strategies`, data);
    logger.info(LOG_CATEGORY, 'Strategy created successfully', { strategy_id: result.strategy_id });
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
  status?: 'draft' | 'active' | 'paused' | 'archived';
  limit?: number;
  offset?: number;
}): Promise<StrategyListResponse> => {
  logger.debug(LOG_CATEGORY, 'Fetching strategies', params);

  try {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
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
): Promise<{ strategy_id: string; updated_at: string }> => {
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
 * Activate strategy
 */
export const activateStrategy = async (
  strategyId: string
): Promise<{ strategy_id: string; updated_at: string }> => {
  logger.info(LOG_CATEGORY, 'Activating strategy', { strategyId });

  try {
    const result = await post(`${ARCHITECT_PREFIX}/strategies/${strategyId}/activate`);
    logger.info(LOG_CATEGORY, 'Strategy activated successfully', { strategyId });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to activate strategy', { error, strategyId });
    throw error;
  }
};

/**
 * Pause strategy
 */
export const pauseStrategy = async (
  strategyId: string
): Promise<{ strategy_id: string; updated_at: string }> => {
  logger.info(LOG_CATEGORY, 'Pausing strategy', { strategyId });

  try {
    const result = await post(`${ARCHITECT_PREFIX}/strategies/${strategyId}/pause`);
    logger.info(LOG_CATEGORY, 'Strategy paused successfully', { strategyId });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to pause strategy', { error, strategyId });
    throw error;
  }
};

/**
 * Archive strategy
 */
export const archiveStrategy = async (
  strategyId: string
): Promise<{ strategy_id: string; updated_at: string }> => {
  logger.info(LOG_CATEGORY, 'Archiving strategy', { strategyId });

  try {
    const result = await post(`${ARCHITECT_PREFIX}/strategies/${strategyId}/archive`);
    logger.info(LOG_CATEGORY, 'Strategy archived successfully', { strategyId });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to archive strategy', { error, strategyId });
    throw error;
  }
};

/**
 * Search strategies by plugin
 */
export const searchStrategiesByPlugin = async (
  plugin: string
): Promise<StrategyListResponse> => {
  logger.debug(LOG_CATEGORY, 'Searching strategies by plugin', { plugin });

  try {
    const result = await get(`${ARCHITECT_PREFIX}/strategies?plugin=${plugin}`);
    logger.info(LOG_CATEGORY, 'Plugin search completed', { plugin, count: result.total });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to search strategies by plugin', { error, plugin });
    throw error;
  }
};

// ============================================================================
// CONVERSATION API (through Pourtier proxy)
// ============================================================================

/**
 * Create conversation
 */
export const createConversation = async (
  data: CreateConversationRequest
): Promise<{ conversation_id: string; created_at: string }> => {
  logger.info(LOG_CATEGORY, 'Creating conversation', { strategy_id: data.strategy_id });

  try {
    const result = await post(`${ARCHITECT_PREFIX}/conversations`, data);
    logger.info(LOG_CATEGORY, 'Conversation created successfully', { conversation_id: result.conversation_id });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to create conversation', { error, strategy_id: data.strategy_id });
    throw error;
  }
};

/**
 * Get conversation history
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation> => {
  logger.debug(LOG_CATEGORY, 'Fetching conversation', { conversationId });

  try {
    const result = await get(`${ARCHITECT_PREFIX}/conversations/${conversationId}`);
    logger.info(LOG_CATEGORY, 'Conversation fetched', { conversationId, messageCount: result.message_count });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch conversation', { error, conversationId });
    throw error;
  }
};

/**
 * Get conversations for strategy
 * FIXED: Use correct endpoint /conversations?strategy_id={id}
 */
export const getStrategyConversations = async (
  strategyId: string
): Promise<{ conversations: Conversation[] }> => {
  logger.debug(LOG_CATEGORY, 'Fetching strategy conversations', { strategyId });

  try {
    const result = await get(`${ARCHITECT_PREFIX}/conversations?strategy_id=${strategyId}`);
    logger.info(LOG_CATEGORY, 'Strategy conversations fetched', { strategyId, count: result.conversations.length });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch strategy conversations', { error, strategyId });
    throw error;
  }
};

/**
 * Add message to conversation
 */
export const addMessage = async (
  conversationId: string,
  message: AddMessageRequest
): Promise<{ message_id: string; timestamp: string }> => {
  logger.debug(LOG_CATEGORY, 'Adding message to conversation', { conversationId, role: message.role });

  try {
    const result = await post(
      `${ARCHITECT_PREFIX}/conversations/${conversationId}/messages`,
      message
    );
    logger.info(LOG_CATEGORY, 'Message added successfully', { conversationId, message_id: result.message_id });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to add message', { error, conversationId });
    throw error;
  }
};

/**
 * Get user analytics
 */
export const getUserAnalytics = async (): Promise<{
  total_strategies: number;
  active_strategies: number;
  total_conversations: number;
  avg_messages_per_conversation: number;
  most_used_plugins: Array<{ plugin: string; count: number }>;
}> => {
  logger.debug(LOG_CATEGORY, 'Fetching user analytics');

  try {
    const result = await get(`${ARCHITECT_PREFIX}/analytics/me`);
    logger.info(LOG_CATEGORY, 'User analytics fetched', { totalStrategies: result.total_strategies });
    return result;
  } catch (error) {
    logger.error(LOG_CATEGORY, 'Failed to fetch user analytics', { error });
    throw error;
  }
};

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
