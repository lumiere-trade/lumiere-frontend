/**
 * Unified Prophet Hook with real SSE streaming + smooth typing display
 * OPTIMIZED: Uses Redis cache, sends minimal data
 * NEW: Supports strategy_context for editing workflows
 * TYPING EFFECT: Buffers tokens and displays smoothly (~50 chars/sec)
 * FIXED: Uses flushSync for immediate React updates
 * DEBUG: Added detailed console logging
 */

import { useCallback, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
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

// Typing animation config
const CHARS_PER_SECOND = 50;
const MS_PER_CHAR = 1000 / CHARS_PER_SECOND;

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
  const displayBufferRef = useRef<string>('');
  const displayedContentRef = useRef<string>('');
  const typingAnimationRef = useRef<number | null>(null);
  const lastTypingTimeRef = useRef<number>(0);
  const backendCompleteRef = useRef<boolean>(false);

  const { data: health } = useProphetHealthQuery();

  /**
   * Typing animation loop with flushSync for immediate updates
   */
  const startTypingAnimation = useCallback(() => {
    if (typingAnimationRef.current !== null) {
      console.log('[TYPING] Animation already running, skipping');
      return;
    }

    console.log('[TYPING] Starting animation');

    const animate = (timestamp: number) => {
      if (!streamingMessageIdRef.current) {
        console.log('[TYPING] No streaming message ID, stopping');
        typingAnimationRef.current = null;
        return;
      }

      const elapsed = timestamp - lastTypingTimeRef.current;
      
      console.log('[TYPING] Frame:', {
        elapsed: elapsed.toFixed(2),
        threshold: MS_PER_CHAR,
        bufferLength: displayBufferRef.current.length,
        displayedLength: displayedContentRef.current.length,
        backendComplete: backendCompleteRef.current
      });

      if (elapsed >= MS_PER_CHAR && displayBufferRef.current.length > 0) {
        const nextChar = displayBufferRef.current[0];
        displayBufferRef.current = displayBufferRef.current.slice(1);
        displayedContentRef.current += nextChar;

        console.log('[TYPING] Showing char:', JSON.stringify(nextChar), 
                    '| Total displayed:', displayedContentRef.current.length,
                    '| Buffer remaining:', displayBufferRef.current.length);

        lastTypingTimeRef.current = timestamp;

        // CRITICAL: Use flushSync to force immediate React update
        flushSync(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, content: displayedContentRef.current }
                : msg
            )
          );
        });

        console.log('[TYPING] React state updated');
      }

      if (displayBufferRef.current.length > 0 || !backendCompleteRef.current) {
        typingAnimationRef.current = requestAnimationFrame(animate);
      } else {
        console.log('[TYPING] Animation complete');
        typingAnimationRef.current = null;

        flushSync(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        });
      }
    };

    lastTypingTimeRef.current = performance.now();
    typingAnimationRef.current = requestAnimationFrame(animate);
    console.log('[TYPING] First frame scheduled');
  }, [setMessages]);

  useEffect(() => {
    return () => {
      if (typingAnimationRef.current) {
        cancelAnimationFrame(typingAnimationRef.current);
      }
    };
  }, []);

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
      log.group('Prophet Message Send (Redis-Optimized + Strategy Context)');
      log.info('Request details', {
        messagePreview: content.substring(0, 100),
        currentState: conversationState,
        conversationId: conversationId || 'NEW_CONVERSATION',
        messageCount: messages.length + 1,
        redisCache: health?.redis_cache || 'unknown',
        hasStrategyContext: !!currentStrategy,
      });

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);

      const assistantMessageId = `assistant-${Date.now()}`;
      streamingMessageIdRef.current = assistantMessageId;
      displayBufferRef.current = '';
      displayedContentRef.current = '';
      backendCompleteRef.current = false;

      console.log('[SEND] Message setup:', {
        assistantId: assistantMessageId,
        bufferCleared: displayBufferRef.current === '',
        displayedCleared: displayedContentRef.current === ''
      });

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages([...messages, userMessage, assistantMessage]);

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
      } else {
        log.info('Skipping history (Redis cache available)', {
          conversationId,
          redisStatus: health?.redis_cache,
          savedBandwidth: `~${messages.length * 0.5}KB`,
        });
      }

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
            strategy_context: strategyContext,
          },
          (token: string) => {
            console.log('[TOKEN] Received:', JSON.stringify(token), 
                        '| Buffer before:', displayBufferRef.current.length);
            
            displayBufferRef.current += token;
            
            console.log('[TOKEN] Buffer after:', displayBufferRef.current.length,
                        '| Displayed:', displayedContentRef.current.length,
                        '| Animation running:', typingAnimationRef.current !== null);

            if (displayedContentRef.current === '' && typingAnimationRef.current === null) {
              console.log('[TOKEN] First token - starting animation');
              startTypingAnimation();
            }
          },
          (fullMessage, convId, newState) => {
            log.timeEnd('Prophet Response Time');
            backendCompleteRef.current = true;

            console.log('[COMPLETE] Backend done:', {
              fullLength: fullMessage.length,
              bufferRemaining: displayBufferRef.current.length,
              displayed: displayedContentRef.current.length
            });

            if (!conversationId) {
              setConversationId(convId);
              log.info('New conversation created', { conversationId: convId });
            }

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
            resolve({
              message: fullMessage,
              conversation_id: convId,
              state: newState,
            });
          },
          (err) => {
            log.timeEnd('Prophet Response Time');
            log.error('Prophet API Error', {
              error: err.message,
              currentState: conversationState,
              conversationId: conversationId,
            });
            log.groupEnd();

            if (typingAnimationRef.current) {
              cancelAnimationFrame(typingAnimationRef.current);
              typingAnimationRef.current = null;
            }

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
            backendCompleteRef.current = true;
            reject(err);
          },
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
      startTypingAnimation,
    ]
  );

  const clearMessages = useCallback(() => {
    log.info('Clearing conversation', {
      previousState: conversationState,
      messageCount: messages.length,
      conversationId: conversationId,
    });

    if (typingAnimationRef.current) {
      cancelAnimationFrame(typingAnimationRef.current);
      typingAnimationRef.current = null;
    }

    streamingMessageIdRef.current = null;
    displayBufferRef.current = '';
    displayedContentRef.current = '';
    backendCompleteRef.current = false;

    setMessages([]);
    setConversationId(null);
    setConversationState('greeting');
    setStrategyMetadata(null);
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
    messages,
    conversationId,
    conversationState,
    isHealthy: health?.status === 'healthy',
    tsdlVersion: health?.tsdl_version,
    pluginsLoaded: health?.plugins_loaded || [],
    redisCache: health?.redis_cache || 'unknown',

    sendMessage,
    clearMessages,
    loadHistory,

    isSending: messages.some((m) => m.isStreaming),
    error: null,
  };
}
