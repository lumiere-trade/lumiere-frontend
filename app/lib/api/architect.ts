/**
 * Architect API Client
 * Strategy and Conversation management
 */

import apiClient from './client';

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
// STRATEGY API
// ============================================================================

/**
 * Create a new strategy
 */
export const createStrategy = async (
  data: CreateStrategyRequest
): Promise<{ strategy_id: string; created_at: string }> => {
  const response = await apiClient.post('/api/v1/strategies', data);
  return response.data;
};

/**
 * Get all strategies for current user
 */
export const getStrategies = async (params?: {
  status?: 'draft' | 'active' | 'paused' | 'archived';
  limit?: number;
  offset?: number;
}): Promise<StrategyListResponse> => {
  const response = await apiClient.get('/api/v1/strategies', { params });
  return response.data;
};

/**
 * Get single strategy by ID
 */
export const getStrategy = async (strategyId: string): Promise<Strategy> => {
  const response = await apiClient.get(`/api/v1/strategies/${strategyId}`);
  return response.data;
};

/**
 * Update strategy
 */
export const updateStrategy = async (
  strategyId: string,
  updates: UpdateStrategyRequest
): Promise<{ strategy_id: string; updated_at: string }> => {
  const response = await apiClient.patch(
    `/api/v1/strategies/${strategyId}`,
    updates
  );
  return response.data;
};

/**
 * Delete strategy
 */
export const deleteStrategy = async (strategyId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/strategies/${strategyId}`);
};

/**
 * Search strategies by plugin
 */
export const searchStrategiesByPlugin = async (
  plugin: string
): Promise<StrategyListResponse> => {
  const response = await apiClient.get('/api/v1/strategies', {
    params: { plugin },
  });
  return response.data;
};

// ============================================================================
// CONVERSATION API
// ============================================================================

/**
 * Create conversation
 */
export const createConversation = async (
  data: CreateConversationRequest
): Promise<{ conversation_id: string; created_at: string }> => {
  const response = await apiClient.post('/api/v1/conversations', data);
  return response.data;
};

/**
 * Get conversation history
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation> => {
  const response = await apiClient.get(`/api/v1/conversations/${conversationId}`);
  return response.data;
};

/**
 * Get conversations for strategy
 */
export const getStrategyConversations = async (
  strategyId: string
): Promise<{ conversations: Conversation[] }> => {
  const response = await apiClient.get(
    `/api/v1/strategies/${strategyId}/conversations`
  );
  return response.data;
};

/**
 * Add message to conversation
 */
export const addMessage = async (
  conversationId: string,
  message: AddMessageRequest
): Promise<{ message_id: string; timestamp: string }> => {
  const response = await apiClient.post(
    `/api/v1/conversations/${conversationId}/messages`,
    message
  );
  return response.data;
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
  const response = await apiClient.get('/api/v1/users/me/analytics');
  return response.data;
};
