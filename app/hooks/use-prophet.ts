/**
 * Unified Prophet Hook with real SSE streaming
 */

import { useState, useCallback, useRef } from 'react';
import { sendChatMessageStream, SSEEvent } from '@/lib/api/prophet';
import { useProphetHealthQuery } from './queries/use-prophet-queries';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export function useProphet() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const { data: health } = useProphetHealthQuery();

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

      // Create placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      streamingMessageIdRef.current = assistantMessageId;

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setIsSending(true);
      setError(null);

      return new Promise<{ message: string; conversation_id: string; state: string }>(
        (resolve, reject) => {
          sendChatMessageStream(
            {
              message: content,
              conversation_id: conversationId || undefined,
            },
            // onEvent
            (event: SSEEvent) => {
              if (event.type === 'token') {
                // Update message content char by char
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + event.data.token }
                      : msg
                  )
                );
              } else if (event.type === 'metadata') {
                // Update conversation ID from first metadata
                if (!conversationId) {
                  setConversationId(event.data.conversation_id);
                }
              }
            },
            // onComplete
            (fullMessage, convId, state) => {
              setIsSending(false);
              
              // Mark streaming complete
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullMessage, isStreaming: false }
                    : msg
                )
              );

              // Update conversation ID
              if (!conversationId) {
                setConversationId(convId);
              }

              streamingMessageIdRef.current = null;
              resolve({ message: fullMessage, conversation_id: convId, state });
            },
            // onError
            (err) => {
              setIsSending(false);
              setError(err);
              
              // Mark message as error
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: `Error: ${err.message}`, isStreaming: false }
                    : msg
                )
              );

              streamingMessageIdRef.current = null;
              reject(err);
            }
          );
        }
      );
    },
    [conversationId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    streamingMessageIdRef.current = null;
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
    isSending,
    error,
  };
}
