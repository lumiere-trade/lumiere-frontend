/**
 * Chevalier React Query Mutations
 * Live trading deployment mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deployStrategy, stopStrategy } from '@/lib/api/chevalier';

// ============================================================================
// DEPLOYMENT MUTATIONS
// ============================================================================

/**
 * Deploy strategy mutation
 */
export const useDeployStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => deployStrategy(strategyId),
    onSuccess: (data) => {
      toast.success('Strategy deployed successfully!', {
        description: `Execution ID: ${data.execution_id.slice(0, 8)}... | Status: ${data.status}`,
      });
      
      // Invalidate strategy queries to refresh status
      queryClient.invalidateQueries({ 
        queryKey: ['architect', 'strategies'] 
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
 * Stop strategy mutation
 */
export const useStopStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => stopStrategy(strategyId),
    onSuccess: (data) => {
      toast.success('Strategy stopped successfully!', {
        description: `Execution ID: ${data.execution_id.slice(0, 8)}... | Status: ${data.status}`,
      });
      
      // Invalidate strategy queries to refresh status
      queryClient.invalidateQueries({ 
        queryKey: ['architect', 'strategies'] 
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
