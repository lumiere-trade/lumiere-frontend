/**
 * Chevalier React Query Hooks
 * Deployment status queries
 */
import { useQuery } from '@tanstack/react-query';
import {
  getActiveDeployment,
  getActiveDeployments,
  getDeploymentStatus,
  getDeploymentHistory,
  getDeploymentTrades
} from '@/lib/api/chevalier';
import { ApiError } from '@/lib/api/client';

export const chevalierKeys = {
  all: ['chevalier'] as const,
  deployments: () => [...chevalierKeys.all, 'deployments'] as const,
  deployment: (deploymentId: string) =>
    [...chevalierKeys.deployments(), deploymentId] as const,
  deploymentTrades: (deploymentId: string, limit: number) =>
    [...chevalierKeys.deployment(deploymentId), 'trades', limit] as const,
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
 * Fetch trades for deployment
 * Returns trades executed by this deployment instance
 */
export const useDeploymentTrades = (
  deploymentId: string | null | undefined,
  limit: number = 100
) => {
  return useQuery({
    queryKey: chevalierKeys.deploymentTrades(deploymentId || '', limit),
    queryFn: () => getDeploymentTrades(deploymentId!, limit),
    enabled: !!deploymentId,
    staleTime: 10 * 1000, // 10 seconds - trades update frequently
  });
};

/**
 * Fetch all active deployments
 * Returns empty array if service unavailable or no deployments
 */
export const useActiveDeployments = (userId?: string) => {
  return useQuery({
    queryKey: chevalierKeys.activeDeployments(userId),
    queryFn: async () => {
      try {
        return await getActiveDeployments(userId);
      } catch (error) {
        // Return empty array if service unavailable or any error
        // This prevents dashboard from crashing when Chevalier is down
        if (error instanceof ApiError) {
          console.warn('Chevalier service unavailable:', error.statusCode);
          return [];
        }
        console.warn('Failed to fetch active deployments:', error);
        return [];
      }
    },
    staleTime: 30 * 1000,
    retry: false, // Don't retry if service is down
  });
};

// Legacy alias
export const useActiveStrategies = useActiveDeployments;
