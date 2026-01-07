/**
 * Chevalier React Query Mutations
 * Live trading deployment mutations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deployStrategy,
  pauseStrategy,
  resumeStrategy,
  stopStrategy,
  undeployStrategy
} from '@/lib/api/chevalier';
import { chevalierKeys } from '@/hooks/queries/use-chevalier-queries';
import type { DeployStrategyRequest } from '@/lib/api/chevalier';

// ============================================================================
// DEPLOYMENT MUTATIONS
// ============================================================================

/**
 * Deploy strategy mutation
 */
export const useDeployStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DeployStrategyRequest) => deployStrategy(request),
    onSuccess: (data) => {
      toast.success('Strategy deployed successfully!', {
        description: `Strategy ID: ${data.strategy_id.slice(0, 8)}... | Paper: ${data.is_paper_trading ? 'Yes' : 'No'}`,
      });

      // Invalidate strategy queries to refresh status
      queryClient.invalidateQueries({
        queryKey: ['architect', 'strategies']
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategies()
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategyStatus(data.strategy_id)
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Failed to deploy strategy';
      toast.error('Deployment failed', {
        description: message,
      });
      console.error('Deploy strategy error:', error);
    },
  });
};

/**
 * Pause strategy mutation
 */
export const usePauseStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => pauseStrategy(strategyId),
    onSuccess: (data, strategyId) => {
      toast.success('Strategy paused successfully!');

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['architect', 'strategies']
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategies()
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategyStatus(strategyId)
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Failed to pause strategy';
      toast.error('Pause failed', {
        description: message,
      });
      console.error('Pause strategy error:', error);
    },
  });
};

/**
 * Resume strategy mutation
 */
export const useResumeStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => resumeStrategy(strategyId),
    onSuccess: (data, strategyId) => {
      toast.success('Strategy resumed successfully!');

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['architect', 'strategies']
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategies()
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategyStatus(strategyId)
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Failed to resume strategy';
      toast.error('Resume failed', {
        description: message,
      });
      console.error('Resume strategy error:', error);
    },
  });
};

/**
 * Stop strategy mutation
 */
export const useStopStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => stopStrategy(strategyId),
    onSuccess: (data, strategyId) => {
      toast.success('Strategy stopped successfully!');

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['architect', 'strategies']
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategies()
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategyStatus(strategyId)
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Failed to stop strategy';
      toast.error('Stop failed', {
        description: message,
      });
      console.error('Stop strategy error:', error);
    },
  });
};

/**
 * Undeploy strategy mutation
 */
export const useUndeployStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => undeployStrategy(strategyId),
    onSuccess: (data, strategyId) => {
      toast.success('Strategy undeployed successfully!');

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['architect', 'strategies']
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategies()
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.strategyStatus(strategyId)
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Failed to undeploy strategy';
      toast.error('Undeploy failed', {
        description: message,
      });
      console.error('Undeploy strategy error:', error);
    },
  });
};
