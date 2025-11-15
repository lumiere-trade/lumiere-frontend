/**
 * Unified Prophet Hook
 * Provides Prophet AI chat functionality
 */

import { useState, useCallback } from 'react';
import { useSendChatMessageMutation } from './mutations/use-prophet-mutations';
import { useProphetHealthQuery } from './queries/use-prophet-queries';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useProphet() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { data: health } = useProphetHealthQuery();
  const sendMessageMutation = useSendChatMessageMutation();

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Send to Prophet
        const response = await sendMessageMutation.mutateAsync({
          message: content,
          conversation_id: conversationId || undefined,
        });

        // Update conversation ID
        if (!conversationId) {
          setConversationId(response.conversation_id);
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        return response;
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    },
    [conversationId, sendMessageMutation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    // State
    messages,
    conversationId,
    isHealthy: health?.status === 'healthy',
    tsdlVersion: health?.tsdl_version,
    pluginsLoaded: health?.plugins_loaded || [],

    // Actions
    sendMessage,
    clearMessages,

    // Loading states
    isSending: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}
