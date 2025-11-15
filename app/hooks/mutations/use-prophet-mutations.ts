/**
 * Prophet Mutation Hooks
 * React Query mutations for Prophet AI chat
 */

import { useMutation } from '@tanstack/react-query';
import {
  sendChatMessage,
  ProphetChatRequest,
  ProphetChatResponse,
} from '@/lib/api/prophet';

/**
 * Send chat message to Prophet
 */
export function useSendChatMessageMutation() {
  return useMutation<ProphetChatResponse, Error, ProphetChatRequest>({
    mutationFn: sendChatMessage,
    onError: (error) => {
      console.error('Prophet chat error:', error);
    },
  });
}
