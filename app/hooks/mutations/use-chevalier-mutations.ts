/**
 * Chevalier React Query Mutations
 * Live trading deployment mutations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deployStrategy,
  pauseDeployment,
  resumeDeployment,
  stopDeployment,
  undeployDeployment
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
        description: `Version ${data.version} | ${data.is_paper_trading ? 'Paper Trading' : 'Live Trading'}`,
      });

      // Invalidate queries to refresh status
      queryClient.invalidateQueries({
        queryKey: ['architect', 'strategies']
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.deployments()
      });

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.activeDeployment(data.architect_strategy_id)
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
                      error.message ||
                      'Failed to deploy strategy';
      toast.error('Deployment failed', {
        description: message,
      });
      console.error('Deploy strategy error:', error);
    },
  });
};

/**
 * Pause deployment mutation
 */
export const usePauseDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: string) => pauseDeployment(deploymentId),
    onSuccess: (data, deploymentId) => {
      toast.success('Strategy paused');

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.deployments()
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
                      error.message ||
                      'Failed to pause strategy';
      toast.error('Pause failed', { description: message });
      console.error('Pause deployment error:', error);
    },
  });
};

/**
 * Resume deployment mutation
 */
export const useResumeDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: string) => resumeDeployment(deploymentId),
    onSuccess: (data, deploymentId) => {
      toast.success('Strategy resumed');

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.deployments()
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
                      error.message ||
                      'Failed to resume strategy';
      toast.error('Resume failed', { description: message });
      console.error('Resume deployment error:', error);
    },
  });
};

/**
 * Stop deployment mutation
 */
export const useStopDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: string) => stopDeployment(deploymentId),
    onSuccess: (data, deploymentId) => {
      toast.success('Strategy stopped');

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.deployments()
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
                      error.message ||
                      'Failed to stop strategy';
      toast.error('Stop failed', { description: message });
      console.error('Stop deployment error:', error);
    },
  });
};

/**
 * Undeploy deployment mutation
 */
export const useUndeployDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: string) => undeployDeployment(deploymentId),
    onSuccess: (data, deploymentId) => {
      toast.success('Strategy undeployed');

      queryClient.invalidateQueries({
        queryKey: chevalierKeys.deployments()
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
                      error.message ||
                      'Failed to undeploy strategy';
      toast.error('Undeploy failed', { description: message });
      console.error('Undeploy deployment error:', error);
    },
  });
};

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export const usePauseStrategy = usePauseDeployment;
export const useResumeStrategy = useResumeDeployment;
export const useStopStrategy = useStopDeployment;
export const useUndeployStrategy = useUndeployDeployment;
