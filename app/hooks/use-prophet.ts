/**
 * Unified Prophet Hook with real SSE streaming
 * Supports stateless architecture - maintains full conversation state
 */

import { useState, useCallback, useRef } from 'react';
import { sendChatMessageStream, StrategyMetadata } from '@/lib/api/prophet';
import { useProphetHealthQuery } from './queries/use-prophet-queries';
import { useLogger } from './use-logger';
import { LogCategory } from '@/lib/debug';
import { useCreateChat } from '@/contexts/CreateChatContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export function useProphet() {
  const log = useLogger('ProphetHook', LogCategory.API);
  const { setStrategyMetadata } = useCreateChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<string>('greeting');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const { data: health } = useProphetHealthQuery();

  const sendMessage = useCallback(
    async (content: string) => {
      log.group('Prophet Message Send');
      log.info('Request details', {
        messagePreview: content.substring(0, 100),
        currentState: conversationState,
        conversationId: conversationId || 'NEW_CONVERSATION',
        historyLength: messages.length,
        messageCount: messages.length + 1,
      });

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

      log.debug('Sending to Prophet API', {
        request: {
          message: content.substring(0, 50) + '...',
          conversation_id: conversationId || 'undefined',
          state: conversationState,
          history_length: history.length,
        }
      });

      log.time('Prophet Response Time');

      return new Promise<{ message: string; conversation_id: string; state: string }>(
        (resolve, reject) => {
          sendChatMessageStream(
            {
              message: content,
              conversation_id: conversationId || undefined,
              state: conversationState,
              history: history,
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
              log.timeEnd('Prophet Response Time');

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
                log.info('New conversation created', { conversationId: convId });
              }

              // Log state transition
              if (newState !== conversationState) {
                log.warn('STATE TRANSITION', {
                  from: conversationState,
                  to: newState,
                  conversationId: convId,
                  messageLength: fullMessage.length,
                  hasTSDL: fullMessage.includes('```tsdl') || fullMessage.includes('```'),
                });
              } else {
                log.info('State unchanged', {
                  state: conversationState,
                  conversationId: convId,
                });
              }

              setConversationState(newState);

              log.info('Response complete', {
                conversationId: convId,
                state: newState,
                responseLength: fullMessage.length,
                responsePreview: fullMessage.substring(0, 100),
                containsTSDL: fullMessage.includes('```tsdl'),
                containsCode: fullMessage.includes('```'),
              });

              log.groupEnd();

              streamingMessageIdRef.current = null;
              resolve({ message: fullMessage, conversation_id: convId, state: newState });
            },
            // onError
            (err) => {
              log.timeEnd('Prophet Response Time');
              log.error('Prophet API Error', {
                error: err.message,
                currentState: conversationState,
                conversationId: conversationId,
              });
              log.groupEnd();

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
            },
            // onStrategyMetadata - NEW callback
            (metadata: StrategyMetadata) => {
              log.info('Strategy metadata received', {
                indicatorsCount: metadata.indicators?.length || 0,
                hasAsset: !!metadata.asset,
                hasExitConditions: !!metadata.exit_conditions,
                hasRiskManagement: !!metadata.risk_management,
                hasPositionSizing: !!metadata.position_sizing,
                indicators: metadata.indicators?.map(ind => ({
                  name: ind.name,
                  type: ind.type,
                  paramsCount: Object.keys(ind.params || {}).length
                }))
              });

              // Store metadata in context
              setStrategyMetadata(metadata);
            }
          );
        }
      );
    },
    [conversationId, conversationState, messages, log, setStrategyMetadata]
  );

  const clearMessages = useCallback(() => {
    log.info('Clearing conversation', {
      previousState: conversationState,
      messageCount: messages.length,
      conversationId: conversationId,
    });

    setMessages([]);
    setConversationId(null);
    setConversationState('greeting');
    setError(null);
    setStrategyMetadata(null);
    streamingMessageIdRef.current = null;
  }, [conversationState, messages, conversationId, log, setStrategyMetadata]);

  return {
    // State
    messages,
    conversationId,
    conversationState,
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
