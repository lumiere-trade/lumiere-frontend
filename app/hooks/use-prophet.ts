/**
 * Prophet Hook - Clean Event-Driven Design
 * CRITICAL: NO client-side detection - Prophet tells us everything via events
 */

import { useCallback, useRef } from 'react';
import {
  sendChatMessageStream,
  ProgressEvent,
  StrategyGeneratedEvent,
  StrategyContext
} from '@/lib/api/prophet';
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
    setIsGeneratingStrategy,
    setStrategyGenerationProgress,
    setProgressStage,
    setProgressMessage,
    setGeneratedStrategy,
  } = useChat();

  const streamingMessageIdRef = useRef<string | null>(null);
  const fullMessageRef = useRef<string>('');

  const { data: health } = useProphetHealthQuery();

  const loadHistory = useCallback(
    (conversation: Conversation) => {
      log.info('Loading conversation history', {
        conversationId: conversation.id,
        messageCount: conversation.message_count,
        state: conversation.state,
      });

      const chatMessages: ChatMessage[] = conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        isStreaming: false,
      }));

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
      log.group('Prophet Message Send');
      log.info('Request details', {
        messagePreview: content.substring(0, 100),
        currentState: conversationState,
        conversationId: conversationId || 'NEW_CONVERSATION',
        messageCount: messages.length + 1,
        redisCache: health?.redis_cache || 'unknown',
        hasStrategyContext: !!currentStrategy,
      });

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);

      // Prepare assistant message ID (but don't create message yet!)
      const assistantMessageId = `assistant-${Date.now()}`;
      streamingMessageIdRef.current = assistantMessageId;
      fullMessageRef.current = '';

      // Prepare fallback history (if Redis not connected or new conversation)
      let fallbackHistory: Array<{ role: string; content: string }> | undefined;
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
      }

      // Prepare strategy context (if editing existing strategy)
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
        });
      }

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
            strategy_context: strategyContext,
          },
          // onToken - real-time character streaming
          (token: string) => {
            fullMessageRef.current += token;

            setMessages((prev) => {
              // Check if assistant message exists
              const assistantExists = prev.some((m) => m.id === assistantMessageId);

              if (!assistantExists) {
                // Create assistant message on first token
                return [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: 'assistant' as const,
                    content: fullMessageRef.current,
                    timestamp: new Date(),
                    isStreaming: true,
                  },
                ];
              } else {
                // Update existing assistant message
                return prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullMessageRef.current }
                    : msg
                );
              }
            });
          },
          // onProgress - Prophet tells us stage and percent
          (progress: ProgressEvent) => {
            log.info('Progress update', {
              stage: progress.stage,
              percent: progress.percent,
              message: progress.message,
            });

            setIsGeneratingStrategy(true);
            setProgressStage(progress.stage);
            setProgressMessage(progress.message);
            setStrategyGenerationProgress(progress.percent);
          },
          // onStrategyGenerated - Prophet sends complete strategy
          (strategy: StrategyGeneratedEvent) => {
            log.info('Strategy generated', {
              strategyId: strategy.strategy_id,
              strategyName: strategy.strategy_name,
              tsdlLength: strategy.tsdl_code.length,
              indicatorsCount: strategy.parameters.indicators?.length || 0,
            });

            // Hide progress bar
            setIsGeneratingStrategy(false);
            setStrategyGenerationProgress(0);

            // Store strategy metadata
            setStrategyMetadata(strategy.parameters);

            // Store generated strategy for display
            setGeneratedStrategy({
              name: strategy.strategy_name,
              type: 'indicator_based',
              parameters: {},
              tsdl_code: strategy.tsdl_code,
            });
          },
          // onComplete - stream finished
          (fullMessage, convId, newState) => {
            log.timeEnd('Prophet Response Time');

            if (!conversationId) {
              setConversationId(convId);
            }

            setConversationState(newState);

            // Mark message as complete
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );

            streamingMessageIdRef.current = null;

            log.info('Response complete', {
              conversationId: convId,
              state: newState,
              responseLength: fullMessage.length,
            });

            log.groupEnd();

            resolve({
              message: fullMessage,
              conversation_id: convId,
              state: newState,
            });
          },
          // onError
          (err) => {
            log.timeEnd('Prophet Response Time');
            log.error('Prophet API Error', { error: err.message });
            log.groupEnd();

            setMessages((prev) => {
              const assistantExists = prev.some((m) => m.id === assistantMessageId);

              if (!assistantExists) {
                // Create error message if no assistant message exists
                return [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: 'assistant' as const,
                    content: `Error: ${err.message}`,
                    timestamp: new Date(),
                    isStreaming: false,
                  },
                ];
              } else {
                // Update existing message with error
                return prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: `Error: ${err.message}`,
                        isStreaming: false,
                      }
                    : msg
                );
              }
            });

            setIsGeneratingStrategy(false);
            setStrategyGenerationProgress(0);
            streamingMessageIdRef.current = null;

            reject(err);
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
      setIsGeneratingStrategy,
      setStrategyGenerationProgress,
      setProgressStage,
      setProgressMessage,
      setGeneratedStrategy,
    ]
  );

  const clearMessages = useCallback(() => {
    log.info('Clearing conversation');

    streamingMessageIdRef.current = null;
    fullMessageRef.current = '';

    setMessages([]);
    setConversationId(null);
    setConversationState('greeting');
    setStrategyMetadata(null);
    setIsGeneratingStrategy(false);
    setStrategyGenerationProgress(0);
  }, [
    log,
    setStrategyMetadata,
    setMessages,
    setConversationId,
    setConversationState,
    setIsGeneratingStrategy,
    setStrategyGenerationProgress,
  ]);

  return {
    messages,
    conversationId,
    conversationState,
    isHealthy: health?.status === 'healthy',
    redisCache: health?.redis_cache || 'unknown',

    sendMessage,
    clearMessages,
    loadHistory,

    isSending: messages.some((m) => m.isStreaming),
    error: null,
  };
}
