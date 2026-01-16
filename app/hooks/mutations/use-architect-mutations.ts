import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createStrategy,
  updateStrategy,
  deleteStrategy,
  CreateStrategyRequest,
  UpdateStrategyRequest,
} from '@/lib/api/architect';
import { architectKeys } from '../queries/use-architect-queries';

/**
 * Create strategy mutation
 */
export const useCreateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStrategyRequest) => createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: architectKeys.strategyLists() });
      queryClient.invalidateQueries({ queryKey: architectKeys.analytics() });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create strategy';
      toast.error(message);
      console.error('Create strategy error:', error);
    },
  });
};

/**
 * Update strategy mutation
 */
export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ strategyId, updates }: { strategyId: string; updates: UpdateStrategyRequest }) =>
      updateStrategy(strategyId, updates),
    onSuccess: (_, { strategyId }) => {
      queryClient.invalidateQueries({ queryKey: architectKeys.strategyLists() });
      queryClient.invalidateQueries({ queryKey: architectKeys.strategyDetail(strategyId) });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update strategy';
      toast.error(message);
      console.error('Update strategy error:', error);
    },
  });
};

/**
 * Delete strategy mutation
 */
export const useDeleteStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => deleteStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: architectKeys.strategyLists() });
      queryClient.invalidateQueries({ queryKey: architectKeys.analytics() });
      toast.success('Strategy deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete strategy';
      toast.error(message);
      console.error('Delete strategy error:', error);
    },
  });
};
