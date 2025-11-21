/**
 * Unified Prophet Hook with real SSE streaming
 * OPTIMIZED: Uses Redis cache, sends minimal data
 * NEW: Supports strategy_context for editing workflows
 */

import { useCallback, useRef } from 'react';
import { sendChatMessageStream, StrategyMetadata, StrategyContext } from '@/lib/api/prophet';
import { useProphetHealthQuery } from './queries/use-prophet-queries';
import { useLogger } from './use-logger';
import { LogCategory } from '@/lib/debug';
import { useChat } from '@/contexts/ChatContext';
import { Conversation } from '@/lib/api/architect';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export function useProphet() {
  const log = useLogger('ProphetHook', LogCategory.API);
  const {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    conversationState,
    setConversationState,
    setStrategyMetadata,
    currentStrategy,
  } = useChat();

  const streamingMessageIdRef = useRef<string | null>(null);
  const { data: health } = useProphetHealthQuery();

  /**
   * Load conversation history from Architect API
   */
  const loadHistory = useCallback(
    (conversation: Conversation) => {
      log.info('Loading conversation history', {
        conversationId: conversation.id,
        messageCount: conversation.message_count,
        state: conversation.state,
      });

      // Convert Architect messages to ChatMessage format
      const chatMessages: ChatMessage[] = conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        isStreaming: false,
      }));

      // Set messages and conversation state
      setMessages(chatMessages);
      setConversationId(conversation.id);
      setConversationState(conversation.state);

      log.info('Conversation history loaded', {
        messagesLoaded: chatMessages.length,
        conversationId: conversation.id,
        state: conversation.state,
      });
    },
    [log, setMessages, setConversationId, setConversationState]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      log.group('Prophet Message Send (Redis-Optimized + Strategy Context)');
      log.info('Request details', {
        messagePreview: content.substring(0, 100),
        currentState: conversationState,
        conversationId: conversationId || 'NEW_CONVERSATION',
        messageCount: messages.length + 1,
        redisCache: health?.redis_cache || 'unknown',
        hasStrategyContext: !!currentStrategy,
      });

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);

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
      setMessages([...messages, userMessage, assistantMessage]);

      // Build OPTIONAL fallback history
      // Prophet will try Redis first, use this only if cache miss
      let fallbackHistory: Array<{ role: string; content: string }> | undefined;

      // Only send history if Redis is disconnected OR this is first message
      const redisConnected = health?.redis_cache === 'connected';

      if (!redisConnected || !conversationId) {
        fallbackHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        log.warn('Including fallback history', {
          reason: !redisConnected ? 'Redis disconnected' : 'New conversation',
          historyLength: fallbackHistory.length,
        });
      } else {
        log.info('Skipping history (Redis cache available)', {
          conversationId,
          redisStatus: health?.redis_cache,
          savedBandwidth: `~${messages.length * 0.5}KB`,
        });
      }

      // Build strategy_context if editing existing strategy
      let strategyContext: StrategyContext | undefined;
      if (currentStrategy) {
        strategyContext = {
          strategy_id: currentStrategy.id,
          current_tsdl: currentStrategy.tsdl_code,
          strategy_name: currentStrategy.name,
          last_updated: currentStrategy.updated_at,
        };

        log.info('Including strategy context', {
          strategyId: currentStrategy.id,
          strategyName: currentStrategy.name,
          tsdlLength: currentStrategy.tsdl_code.length,
        });
      }

      log.debug('Sending to Prophet API', {
        request: {
          message: content.substring(0, 50) + '...',
          conversation_id: conversationId || 'undefined',
          state: conversationState,
          history_included: !!fallbackHistory,
          history_length: fallbackHistory?.length || 0,
          strategy_context_included: !!strategyContext,
        },
      });

      log.time('Prophet Response Time');

      return new Promise<{
        message: string;
        conversation_id: string;
        state: string;
      }>((resolve, reject) => {
        sendChatMessageStream(
          {
            message: content,
            conversation_id: conversationId || undefined,
            state: conversationState,
            history: fallbackHistory,
            strategy_context: strategyContext, // NEW!
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
                hasTSDL:
                  fullMessage.includes('```tsdl') || fullMessage.includes('```'),
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
            resolve({
              message: fullMessage,
              conversation_id: convId,
              state: newState,
            });
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

            // Mark message as error
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: `Error: ${err.message}`,
                      isStreaming: false,
                    }
                  : msg
              )
            );

            streamingMessageIdRef.current = null;
            reject(err);
          },
          // onStrategyMetadata - callback for strategy parameters
          (metadata: StrategyMetadata) => {
            log.info('Strategy metadata received', {
              indicatorsCount: metadata.indicators?.length || 0,
              hasAsset: !!metadata.asset,
              hasExitConditions: !!metadata.exit_conditions,
              hasRiskManagement: !!metadata.risk_management,
              hasPositionSizing: !!metadata.position_sizing,
              indicators: metadata.indicators?.map((ind) => ({
                name: ind.name,
                type: ind.type,
                paramsCount: Object.keys(ind.params || {}).length,
              })),
            });

            // Store metadata in context
            setStrategyMetadata(metadata);
          }
        );
      });
    },
    [
      conversationId,
      conversationState,
      messages,
      currentStrategy,
      health,
      log,
      setStrategyMetadata,
      setMessages,
      setConversationId,
      setConversationState,
    ]
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
    setStrategyMetadata(null);
    streamingMessageIdRef.current = null;
  }, [
    conversationState,
    messages,
    conversationId,
    log,
    setStrategyMetadata,
    setMessages,
    setConversationId,
    setConversationState,
  ]);

  return {
    // State from context
    messages,
    conversationId,
    conversationState,
    isHealthy: health?.status === 'healthy',
    tsdlVersion: health?.tsdl_version,
    pluginsLoaded: health?.plugins_loaded || [],
    redisCache: health?.redis_cache || 'unknown',

    // Actions
    sendMessage,
    clearMessages,
    loadHistory,

    // Loading states
    isSending: messages.some((m) => m.isStreaming),
    error: null, // Errors are now in message content
  };
}
