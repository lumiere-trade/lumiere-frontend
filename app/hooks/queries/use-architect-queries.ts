/**
 * Architect React Query Hooks
 * Strategy and Conversation queries
 */

import { useQuery } from '@tanstack/react-query';
import {
  getStrategies,
  getStrategy,
  getConversation,
  getStrategyConversations,
  getUserAnalytics,
  getLibraryCategories,
  getLibraryStrategies,
  getLibraryStrategy,
  searchLibraryStrategies,
} from '@/lib/api/architect';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const architectKeys = {
  all: ['architect'] as const,

  // Strategies
  strategies: () => [...architectKeys.all, 'strategies'] as const,
  strategyLists: () => [...architectKeys.strategies(), 'list'] as const,
  strategyList: (filters: string) => [...architectKeys.strategyLists(), filters] as const,
  strategyDetails: () => [...architectKeys.strategies(), 'detail'] as const,
  strategyDetail: (id: string) => [...architectKeys.strategyDetails(), id] as const,

  // Conversations
  conversations: () => [...architectKeys.all, 'conversations'] as const,
  conversationDetail: (id: string) => [...architectKeys.conversations(), id] as const,
  strategyConversations: (strategyId: string) =>
    [...architectKeys.strategies(), strategyId, 'conversations'] as const,

  // Analytics
  analytics: () => [...architectKeys.all, 'analytics'] as const,

  // Library
  library: () => [...architectKeys.all, 'library'] as const,
  libraryCategories: () => [...architectKeys.library(), 'categories'] as const,
  libraryStrategies: () => [...architectKeys.library(), 'strategies'] as const,
  libraryStrategyList: (filters: string) => [...architectKeys.libraryStrategies(), filters] as const,
  libraryStrategyDetail: (id: string) => [...architectKeys.libraryStrategies(), id] as const,
  librarySearch: (query: string) => [...architectKeys.libraryStrategies(), 'search', query] as const,
};

// ============================================================================
// STRATEGY QUERIES
// ============================================================================

/**
 * Fetch all strategies
 */
export const useStrategies = (params?: {
  status?: 'draft' | 'active' | 'paused' | 'archived';
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: architectKeys.strategyList(JSON.stringify(params || {})),
    queryFn: () => getStrategies(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch single strategy
 */
export const useStrategy = (strategyId: string | undefined) => {
  return useQuery({
    queryKey: architectKeys.strategyDetail(strategyId || ''),
    queryFn: () => getStrategy(strategyId!),
    enabled: !!strategyId,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// CONVERSATION QUERIES
// ============================================================================

/**
 * Fetch conversation history
 */
export const useConversation = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: architectKeys.conversationDetail(conversationId || ''),
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for active chats)
  });
};

/**
 * Fetch conversations for strategy
 */
export const useStrategyConversations = (strategyId: string | undefined) => {
  return useQuery({
    queryKey: architectKeys.strategyConversations(strategyId || ''),
    queryFn: () => getStrategyConversations(strategyId!),
    enabled: !!strategyId,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Fetch user analytics
 */
export const useUserAnalytics = () => {
  return useQuery({
    queryKey: architectKeys.analytics(),
    queryFn: getUserAnalytics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ============================================================================
// LIBRARY QUERIES
// ============================================================================

/**
 * Fetch library categories
 */
export const useLibraryCategories = () => {
  return useQuery({
    queryKey: architectKeys.libraryCategories(),
    queryFn: getLibraryCategories,
    staleTime: 60 * 60 * 1000, // 1 hour (categories rarely change)
  });
};

/**
 * Fetch library strategies
 */
export const useLibraryStrategies = (params?: {
  category?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: architectKeys.libraryStrategyList(JSON.stringify(params || {})),
    queryFn: () => getLibraryStrategies(params),
    staleTime: 30 * 60 * 1000, // 30 minutes (library strategies rarely change)
  });
};

/**
 * Fetch single library strategy
 */
export const useLibraryStrategy = (strategyId: string | undefined) => {
  return useQuery({
    queryKey: architectKeys.libraryStrategyDetail(strategyId || ''),
    queryFn: () => getLibraryStrategy(strategyId!),
    enabled: !!strategyId,
    staleTime: 30 * 60 * 1000,
  });
};

/**
 * Search library strategies
 */
export const useLibrarySearch = (query: string, limit?: number) => {
  return useQuery({
    queryKey: architectKeys.librarySearch(query),
    queryFn: () => searchLibraryStrategies(query, limit),
    enabled: query.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
