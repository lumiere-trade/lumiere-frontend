import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createStrategy,
  updateStrategy,
  deleteStrategy,
  createConversation,
  addMessage,
  CreateStrategyRequest,
  UpdateStrategyRequest,
  CreateConversationRequest,
  AddMessageRequest,
} from '@/lib/api/architect';

/**
 * Create strategy mutation
 */
export const useCreateStrategy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStrategyRequest) => createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
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
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      toast.success('Strategy deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete strategy';
      toast.error(message);
      console.error('Delete strategy error:', error);
    },
  });
};

// ============================================================================
// CONVERSATION MUTATIONS
// ============================================================================

/**
 * Create conversation mutation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) => createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to save conversation';
      toast.error(message);
      console.error('Create conversation error:', error);
    },
  });
};

/**
 * Add message mutation
 */
export const useAddMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: AddMessageRequest }) =>
      addMessage(conversationId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to add message';
      toast.error(message);
      console.error('Add message error:', error);
    },
  });
};
