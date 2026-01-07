/**
 * Chevalier React Query Hooks
 * Deployment status queries
 */
import { useQuery } from '@tanstack/react-query';
import { getStrategyStatus, getActiveStrategies } from '@/lib/api/chevalier';
import { ApiError } from '@/lib/api/client';

export const chevalierKeys = {
  all: ['chevalier'] as const,
  strategies: () => [...chevalierKeys.all, 'strategies'] as const,
  strategyStatus: (strategyId: string) => [...chevalierKeys.strategies(), strategyId] as const,
  activeStrategies: (userId?: string) => [...chevalierKeys.strategies(), 'active', userId] as const,
};

/**
 * Fetch deployment status for a specific strategy
 * Returns null if strategy is not deployed (404)
 */
export const useStrategyDeploymentStatus = (strategyId: string | null | undefined) => {
  return useQuery({
    queryKey: chevalierKeys.strategyStatus(strategyId || ''),
    queryFn: async () => {
      try {
        return await getStrategyStatus(strategyId!);
      } catch (error) {
        // 404 means strategy not deployed - return null instead of error
        if (error instanceof ApiError && error.statusCode === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!strategyId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

/**
 * Fetch all active strategies
 */
export const useActiveStrategies = (userId?: string) => {
  return useQuery({
    queryKey: chevalierKeys.activeStrategies(userId),
    queryFn: () => getActiveStrategies(userId),
    staleTime: 30 * 1000,
  });
};
