/**
 * Architect API Client
 * Strategy and Conversation management
 * NOW: Communicates through Pourtier proxy (/api/architect/*)
 */

import { get, post, patch, del } from './client';

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

// ============================================================================
// STRATEGY API (through Pourtier proxy)
// ============================================================================

const ARCHITECT_PREFIX = '/api/architect';

/**
 * Create a new strategy
 */
export const createStrategy = async (
  data: CreateStrategyRequest
): Promise<{ strategy_id: string; created_at: string }> => {
  return post(`${ARCHITECT_PREFIX}/strategies`, data);
};

/**
 * Get all strategies for current user
 */
export const getStrategies = async (params?: {
  status?: 'draft' | 'active' | 'paused' | 'archived';
  limit?: number;
  offset?: number;
}): Promise<StrategyListResponse> => {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const queryString = query.toString();
  const endpoint = queryString
    ? `${ARCHITECT_PREFIX}/strategies?${queryString}`
    : `${ARCHITECT_PREFIX}/strategies`;

  return get(endpoint);
};

/**
 * Get single strategy by ID
 */
export const getStrategy = async (strategyId: string): Promise<Strategy> => {
  return get(`${ARCHITECT_PREFIX}/strategies/${strategyId}`);
};

/**
 * Update strategy
 */
export const updateStrategy = async (
  strategyId: string,
  updates: UpdateStrategyRequest
): Promise<{ strategy_id: string; updated_at: string }> => {
  return patch(`${ARCHITECT_PREFIX}/strategies/${strategyId}`, updates);
};

/**
 * Delete strategy
 */
export const deleteStrategy = async (strategyId: string): Promise<void> => {
  return del(`${ARCHITECT_PREFIX}/strategies/${strategyId}`);
};

/**
 * Activate strategy
 */
export const activateStrategy = async (
  strategyId: string
): Promise<{ strategy_id: string; updated_at: string }> => {
  return post(`${ARCHITECT_PREFIX}/strategies/${strategyId}/activate`);
};

/**
 * Pause strategy
 */
export const pauseStrategy = async (
  strategyId: string
): Promise<{ strategy_id: string; updated_at: string }> => {
  return post(`${ARCHITECT_PREFIX}/strategies/${strategyId}/pause`);
};

/**
 * Archive strategy
 */
export const archiveStrategy = async (
  strategyId: string
): Promise<{ strategy_id: string; updated_at: string }> => {
  return post(`${ARCHITECT_PREFIX}/strategies/${strategyId}/archive`);
};

/**
 * Search strategies by plugin
 */
export const searchStrategiesByPlugin = async (
  plugin: string
): Promise<StrategyListResponse> => {
  return get(`${ARCHITECT_PREFIX}/strategies?plugin=${plugin}`);
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
  return post(`${ARCHITECT_PREFIX}/conversations`, data);
};

/**
 * Get conversation history
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation> => {
  return get(`${ARCHITECT_PREFIX}/conversations/${conversationId}`);
};

/**
 * Get conversations for strategy
 */
export const getStrategyConversations = async (
  strategyId: string
): Promise<{ conversations: Conversation[] }> => {
  return get(`${ARCHITECT_PREFIX}/strategies/${strategyId}/conversations`);
};

/**
 * Add message to conversation
 */
export const addMessage = async (
  conversationId: string,
  message: AddMessageRequest
): Promise<{ message_id: string; timestamp: string }> => {
  return post(
    `${ARCHITECT_PREFIX}/conversations/${conversationId}/messages`,
    message
  );
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
  return get(`${ARCHITECT_PREFIX}/analytics/me`);
};
