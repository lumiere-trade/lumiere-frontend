/**
 * Chevalier React Query Hooks
 * Deployment status queries
 */
import { useQuery } from '@tanstack/react-query';
import {
  getActiveDeployment,
  getActiveDeployments,
  getDeploymentStatus,
  getDeploymentHistory
} from '@/lib/api/chevalier';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/hooks/use-auth';

export const chevalierKeys = {
  all: ['chevalier'] as const,
  deployments: () => [...chevalierKeys.all, 'deployments'] as const,
  deployment: (deploymentId: string) =>
    [...chevalierKeys.deployments(), deploymentId] as const,
  activeDeployment: (architectStrategyId: string) =>
    [...chevalierKeys.deployments(), 'active', architectStrategyId] as const,
  activeDeployments: (userId?: string) =>
    [...chevalierKeys.deployments(), 'active', 'all', userId] as const,
  history: (architectStrategyId: string) =>
    [...chevalierKeys.deployments(), 'history', architectStrategyId] as const,
  // Legacy keys for backward compatibility
  strategies: () => chevalierKeys.deployments(),
  strategyStatus: (id: string) => chevalierKeys.activeDeployment(id),
};

/**
 * Fetch active deployment for specific Architect strategy
 * Returns null if no active deployment exists (404 is expected)
 */
export const useStrategyDeploymentStatus = (
  architectStrategyId: string | null | undefined
) => {
  return useQuery({
    queryKey: chevalierKeys.activeDeployment(architectStrategyId || ''),
    queryFn: async () => {
      if (!architectStrategyId) return null;

      try {
        return await getActiveDeployment(architectStrategyId);
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!architectStrategyId,
    staleTime: 30 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.statusCode === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Fetch deployment by deployment instance ID
 */
export const useDeploymentStatus = (deploymentId: string | null | undefined) => {
  return useQuery({
    queryKey: chevalierKeys.deployment(deploymentId || ''),
    queryFn: () => getDeploymentStatus(deploymentId!),
    enabled: !!deploymentId,
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch deployment history for Architect strategy
 */
export const useDeploymentHistory = (
  architectStrategyId: string | null | undefined
) => {
  return useQuery({
    queryKey: chevalierKeys.history(architectStrategyId || ''),
    queryFn: () => getDeploymentHistory(architectStrategyId!),
    enabled: !!architectStrategyId,
    staleTime: 60 * 1000,
  });
};

/**
 * Fetch all active deployments
 */
export const useActiveDeployments = (userId?: string) => {
  return useQuery({
    queryKey: chevalierKeys.activeDeployments(userId),
    queryFn: () => getActiveDeployments(userId),
    staleTime: 30 * 1000,
  });
};

// Legacy alias
export const useActiveStrategies = useActiveDeployments;
