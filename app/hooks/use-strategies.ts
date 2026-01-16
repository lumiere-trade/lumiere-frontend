/**
 * Unified Strategies Hook
 * Combines queries and mutations for strategy management
 */

import {
  useStrategies as useStrategiesQuery,
  useStrategy,
} from './queries/use-architect-queries';
import {
  useCreateStrategy,
  useUpdateStrategy,
  useDeleteStrategy,
} from './mutations/use-architect-mutations';

export function useStrategies(params?: {
  status?: 'draft' | 'active' | 'paused' | 'archived';
  limit?: number;
  offset?: number;
}) {
  // Queries
  const strategiesQuery = useStrategiesQuery(params);

  // Mutations
  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();
  const deleteMutation = useDeleteStrategy();

  return {
    // Data
    strategies: strategiesQuery.data?.strategies ?? [],
    total: strategiesQuery.data?.total ?? 0,

    // Loading states
    isLoading: strategiesQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error states
    error: strategiesQuery.error,

    // Actions
    createStrategy: createMutation.mutateAsync,
    updateStrategy: (strategyId: string, updates: any) =>
      updateMutation.mutateAsync({ strategyId, updates }),
    deleteStrategy: deleteMutation.mutateAsync,

    // Refetch
    refetch: strategiesQuery.refetch,
  };
}

// Hook for single strategy
export function useStrategyDetail(strategyId: string | undefined) {
  const strategyQuery = useStrategy(strategyId);
  const updateMutation = useUpdateStrategy();
  const deleteMutation = useDeleteStrategy();

  return {
    strategy: strategyQuery.data,
    isLoading: strategyQuery.isLoading,
    error: strategyQuery.error,

    updateStrategy: (updates: any) =>
      updateMutation.mutateAsync({ strategyId: strategyId!, updates }),
    deleteStrategy: () => deleteMutation.mutateAsync(strategyId!),

    refetch: strategyQuery.refetch,
  };
}
