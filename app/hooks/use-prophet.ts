/**
 * Unified Prophet Hook with real SSE streaming
 * Supports stateless architecture - maintains full conversation state
 */

import { useState, useCallback, useRef } from 'react';
import { sendChatMessageStream } from '@/lib/api/prophet';
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
  const [conversationState, setConversationState] = useState<string>('greeting');  // NEW
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

      // Build history for Prophet (all messages BEFORE the current one)
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      return new Promise<{ message: string; conversation_id: string; state: string }>(
        (resolve, reject) => {
          sendChatMessageStream(
            {
              message: content,
              conversation_id: conversationId || undefined,
              state: conversationState,  // NEW: send current state
              history: history,  // NEW: send full history
            },
            // onToken - append batch of characters
            (tokenBatch: string) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + tokenBatch }
                    : msg
                )
              );
            },
            // onComplete
            (fullMessage, convId, newState) => {
              setIsSending(false);

              // Mark streaming complete
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullMessage, isStreaming: false }
                    : msg
                )
              );

              // Update conversation ID and state
              if (!conversationId) {
                setConversationId(convId);
              }
              setConversationState(newState);  // NEW: update state from Prophet

              console.log('[Prophet] State transition:', conversationState, '→', newState);

              streamingMessageIdRef.current = null;
              resolve({ message: fullMessage, conversation_id: convId, state: newState });
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
    [conversationId, conversationState, messages]  // NEW: added conversationState and messages
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationState('greeting');  // NEW: reset state
    setError(null);
    streamingMessageIdRef.current = null;
  }, []);

  return {
    // State
    messages,
    conversationId,
    conversationState,  // NEW: expose current state
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
