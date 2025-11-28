/**
 * Unified Prophet Hook with real SSE streaming + smooth typing display
 * OPTIMIZED: Uses Redis cache, sends minimal data
 * NEW: Supports strategy_context for editing workflows
 * TYPING EFFECT: Buffers tokens and displays smoothly (~100 chars/sec)
 * STRATEGY DETECTION: Detects strategy generation, shows progress, continues after
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
const CHARS_PER_SECOND = 100;
const MS_PER_CHAR = 1000 / CHARS_PER_SECOND;

// Strategy detection markers
const STRATEGY_MARKERS = [
  'Strategy Overview',
  'Trading Pair',
  '```tsdl',
  'STRATEGY "',
  'Indicators'
];

// Estimated strategy content length for progress calculation
const ESTIMATED_STRATEGY_LENGTH = 1500;

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
  } = useChat();

  const streamingMessageIdRef = useRef<string | null>(null);
  const displayBufferRef = useRef<string>('');
  const displayedContentRef = useRef<string>('');
  const typingAnimationRef = useRef<number | null>(null);
  const lastTypingTimeRef = useRef<number>(0);
  const backendCompleteRef = useRef<boolean>(false);

  // Strategy generation refs
  const isGeneratingStrategyRef = useRef<boolean>(false);
  const strategyContentRef = useRef<string>('');
  const preStrategyContentRef = useRef<string>('');
  const postStrategyContentRef = useRef<string>('');

  const { data: health } = useProphetHealthQuery();

  /**
   * Check if content contains strategy markers
   */
  const containsStrategyMarker = (content: string): boolean => {
    return STRATEGY_MARKERS.some(marker => content.includes(marker));
  };

  /**
   * Check if strategy block is complete (has closing ```)
   */
  const isStrategyComplete = (strategyContent: string): boolean => {
    // Check if we have a complete TSDL block with closing ```
    const tsdlMatch = strategyContent.match(/```tsdl\n[\s\S]*?```/);
    if (tsdlMatch) {
      return true;
    }
    
    // Alternative: check for "Strategy Overview" followed by enough content
    if (strategyContent.includes('Strategy Overview') && 
        strategyContent.length > 800) {
      // Heuristic: if we have substantial content, likely complete
      return true;
    }
    
    return false;
  };

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

      if (elapsed >= MS_PER_CHAR && displayBufferRef.current.length > 0) {
        const nextChar = displayBufferRef.current[0];
        displayBufferRef.current = displayBufferRef.current.slice(1);
        displayedContentRef.current += nextChar;

        lastTypingTimeRef.current = timestamp;

        flushSync(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, content: displayedContentRef.current }
                : msg
            )
          );
        });
      }

      if (displayBufferRef.current.length > 0 || !backendCompleteRef.current) {
        typingAnimationRef.current = requestAnimationFrame(animate);
      } else {
        console.log('[TYPING] Animation complete');
        typingAnimationRef.current = null;

        const messageId = streamingMessageIdRef.current;

        flushSync(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        });

        streamingMessageIdRef.current = null;
      }
    };

    lastTypingTimeRef.current = performance.now();
    typingAnimationRef.current = requestAnimationFrame(animate);
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
      log.group('Prophet Message Send');
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

      // Reset strategy generation state
      isGeneratingStrategyRef.current = false;
      strategyContentRef.current = '';
      preStrategyContentRef.current = '';
      postStrategyContentRef.current = '';
      setIsGeneratingStrategy(false);
      setStrategyGenerationProgress(0);

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
          (token: string) => {
            console.log('[TOKEN] Received:', JSON.stringify(token));

            // Accumulate full content for detection
            const currentFullContent = displayedContentRef.current + displayBufferRef.current + token;

            // Check if we should switch to strategy generation mode
            if (!isGeneratingStrategyRef.current && containsStrategyMarker(currentFullContent)) {
              console.log('[STRATEGY] Detection triggered!');

              // Stop typing animation
              if (typingAnimationRef.current) {
                cancelAnimationFrame(typingAnimationRef.current);
                typingAnimationRef.current = null;
              }

              // Save pre-strategy content
              preStrategyContentRef.current = displayedContentRef.current;

              // Switch to strategy generation mode
              isGeneratingStrategyRef.current = true;
              setIsGeneratingStrategy(true);

              // Clear display buffer - start accumulating strategy
              displayBufferRef.current = '';

              log.info('Strategy generation detected', {
                preStrategyLength: preStrategyContentRef.current.length
              });
            }

            if (isGeneratingStrategyRef.current) {
              // Accumulate strategy content
              strategyContentRef.current += token;

              // Check if strategy block is complete
              if (isStrategyComplete(strategyContentRef.current)) {
                console.log('[STRATEGY] Strategy block complete - switching to post-strategy mode');
                
                // Set progress to 100%
                setStrategyGenerationProgress(100);
                
                // Update message with pre + strategy content
                const contentSoFar = preStrategyContentRef.current + strategyContentRef.current;
                displayedContentRef.current = contentSoFar;
                
                flushSync(() => {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: contentSoFar }
                        : msg
                    )
                  );
                });

                // Hide progress bar
                setIsGeneratingStrategy(false);
                setStrategyGenerationProgress(0);
                
                // Switch to post-strategy mode (no longer generating)
                isGeneratingStrategyRef.current = false;
                
                log.info('Switched to post-strategy streaming mode');
              } else {
                // Calculate progress (cap at 95% until complete)
                const progress = Math.min(
                  (strategyContentRef.current.length / ESTIMATED_STRATEGY_LENGTH) * 100,
                  95
                );

                setStrategyGenerationProgress(progress);

                console.log('[STRATEGY] Progress:', {
                  length: strategyContentRef.current.length,
                  progress: Math.round(progress)
                });
              }
            } else {
              // Normal typing mode (pre-strategy or post-strategy)
              displayBufferRef.current += token;

              if (displayedContentRef.current === '' && typingAnimationRef.current === null) {
                startTypingAnimation();
              } else if (typingAnimationRef.current === null && displayBufferRef.current.length > 0) {
                // Resume animation if stopped (post-strategy content)
                startTypingAnimation();
              }
            }
          },
          (fullMessage, convId, newState) => {
            log.timeEnd('Prophet Response Time');
            backendCompleteRef.current = true;

            console.log('[COMPLETE] Backend done');

            if (!conversationId) {
              setConversationId(convId);
            }

            setConversationState(newState);

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
          (err) => {
            log.timeEnd('Prophet Response Time');
            log.error('Prophet API Error', { error: err.message });
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

            setIsGeneratingStrategy(false);
            setStrategyGenerationProgress(0);
            streamingMessageIdRef.current = null;
            backendCompleteRef.current = true;
            reject(err);
          },
          (metadata: StrategyMetadata) => {
            log.info('Strategy metadata received', {
              indicatorsCount: metadata.indicators?.length || 0,
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
      setIsGeneratingStrategy,
      setStrategyGenerationProgress,
      startTypingAnimation,
    ]
  );

  const clearMessages = useCallback(() => {
    log.info('Clearing conversation');

    if (typingAnimationRef.current) {
      cancelAnimationFrame(typingAnimationRef.current);
      typingAnimationRef.current = null;
    }

    streamingMessageIdRef.current = null;
    displayBufferRef.current = '';
    displayedContentRef.current = '';
    backendCompleteRef.current = false;
    isGeneratingStrategyRef.current = false;
    strategyContentRef.current = '';
    preStrategyContentRef.current = '';
    postStrategyContentRef.current = '';

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
