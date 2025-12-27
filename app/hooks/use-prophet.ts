import { useState } from 'react'
import { useStrategy } from '@/contexts/StrategyContext'
import { useLogger } from './use-logger'
import { LogCategory } from '@/lib/debug'
import { useProphetHealthQuery } from './queries/use-prophet-queries'
import {
  sendChatMessageStream,
  ProgressEvent,
  StrategyGeneratedEvent,
} from '@/lib/api/prophet'

export function useProphet() {
  const {
    strategy,
    setStrategy,
    updateStrategy,
    updateConversation,
    isGeneratingStrategy,
    setIsGeneratingStrategy,
    setStrategyGenerationProgress,
    setProgressStage,
    setProgressMessage,
    openDetailsPanel,
    setDetailsPanelTab
  } = useStrategy()

  const [isStreaming, setIsStreaming] = useState(false)
  const log = useLogger('useProphet', LogCategory.HOOK)

  // Health check query
  const { data: healthData, error: healthError } = useProphetHealthQuery()
  const isHealthy = healthData?.status === 'healthy'

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    // Extract conversation data from strategy
    const conversationId = strategy?.conversation.id
    const conversationState = strategy?.conversation.state || 'greeting'
    const messages = strategy?.conversation.messages || []

    log.info('Sending message', { message, conversationId })

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }

    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    const newMessages = [...messages, userMessage, assistantMessage]
    
    // Update conversation or create new strategy with conversation
    if (strategy) {
      updateConversation({ messages: newMessages })
    } else {
      // No strategy yet - create initial empty strategy with conversation
      setStrategy({
        id: null,
        name: '',
        description: '',
        tsdl: {
          name: '',
          description: '',
          symbol: 'SOL/USDC',
          timeframe: '1h',
          indicators: [],
          entry_rules: [],
          entry_logic: '',
          exit_rules: [],
          exit_logic: '',
          target_wallet: null,
          copy_percentage: null,
          min_copy_size: null,
          max_copy_size: null,
          copy_delay: null,
          reversion_target: null,
          entry_threshold: null,
          exit_threshold: null,
          lookback_period: null,
          stop_loss: null,
          take_profit: null,
          trailing_stop: null,
          max_position_size: null,
        },
        status: 'draft',
        basePlugins: [],
        version: '1.0.0',
        conversation: {
          id: null,
          messages: newMessages,
          state: 'greeting'
        },
        createdAt: null,
        updatedAt: null
      })
    }

    setIsStreaming(true)

    // Build strategy context if strategy exists
    let strategyContext = undefined
    if (strategy?.id) {
      strategyContext = {
        strategy_id: strategy.id,
        current_tsdl: JSON.stringify(strategy.tsdl, null, 2),
        strategy_name: strategy.name,
        last_updated: strategy.updatedAt
      }
      log.info('Sending with strategy context', { strategyId: strategy.id })
    }

    let fullResponse = ''

    await sendChatMessageStream(
      {
        message,
        conversation_id: conversationId || undefined,
        user_id: 'user-1',
        state: conversationState,
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        strategy_context: strategyContext
      },
      // onToken - stream response text
      (token: string) => {
        fullResponse += token
        updateConversation({
          messages: newMessages.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullResponse, isStreaming: true }
              : msg
          )
        })
      },
      // onProgress - strategy generation progress
      (progress: ProgressEvent) => {
        log.info('Strategy generation progress', progress)
        setIsGeneratingStrategy(true)
        setStrategyGenerationProgress(progress.percent)
        setProgressStage(progress.stage)
        setProgressMessage(progress.message)
      },
      // onStrategyGenerated - build Strategy from Prophet response
      (strategyEvent: StrategyGeneratedEvent) => {
        log.info('Strategy generated', {
          strategyId: strategyEvent.strategy_id,
          strategyName: strategyEvent.strategy_name,
          indicators: strategyEvent.strategy_json.indicators
        })

        // Hide progress
        setIsGeneratingStrategy(false)
        setStrategyGenerationProgress(0)

        // Determine strategy type from TSDL
        const hasWallet = strategyEvent.strategy_json.target_wallet !== null
        const hasIndicators = strategyEvent.strategy_json.indicators.length > 0
        const hasReversion = strategyEvent.strategy_json.reversion_target !== null

        const strategyType = hasWallet && hasIndicators ? 'hybrid'
          : hasWallet ? 'wallet_following'
          : hasReversion ? 'mean_reversion'
          : 'indicator_based'

        if (strategy) {
          // Update existing strategy
          updateStrategy({
            name: strategyEvent.strategy_name,
            description: strategyEvent.strategy_json.description,
            tsdl: strategyEvent.strategy_json,
            basePlugins: [strategyType]
          })
        } else {
          // Create new strategy from Prophet response
          setStrategy({
            id: null,
            name: strategyEvent.strategy_name,
            description: strategyEvent.strategy_json.description,
            tsdl: strategyEvent.strategy_json,
            status: 'draft',
            basePlugins: [strategyType],
            version: '1.0.0',
            conversation: {
              id: null,
              messages: newMessages.map(msg =>
                msg.id === assistantMessage.id
                  ? { ...msg, hasStrategy: true }
                  : msg
              ),
              state: conversationState
            },
            createdAt: null,
            updatedAt: null
          })
        }

        // Open details panel to show strategy
        openDetailsPanel()
        setDetailsPanelTab('parameters')

        // Mark assistant message as containing strategy
        updateConversation({
          messages: newMessages.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, hasStrategy: true }
              : msg
          )
        })

        log.info('Strategy stored in context', {
          strategyId: strategyEvent.strategy_id
        })
      },
      // onComplete - message streaming complete
      (fullMessage: string, convId: string, state: string) => {
        log.info('Message complete', {
          conversationId: convId,
          state,
          messageLength: fullMessage.length
        })

        setIsStreaming(false)

        // Update conversation with final state
        updateConversation({
          id: convId,
          state,
          messages: newMessages.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullMessage, isStreaming: false }
              : msg
          )
        })
      },
      // onError - handle streaming errors
      (error: Error) => {
        log.error('Prophet error', { error })
        setIsStreaming(false)
        setIsGeneratingStrategy(false)

        updateConversation({
          messages: newMessages.map(msg =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: `Error: ${error.message}`,
                  isStreaming: false
                }
              : msg
          )
        })
      }
    )
  }

  // Deprecated - conversation history loads via StrategyContext
  const loadHistory = async () => {
    log.warn('loadHistory is deprecated - history loads via StrategyContext')
  }

  const stopGeneration = () => {
    log.warn('stopGeneration not yet implemented')
  }

  return {
    messages: strategy?.conversation.messages || [],
    isStreaming,
    isSending: isStreaming,
    isGeneratingStrategy,
    isHealthy,
    error: healthError,
    sendMessage,
    loadHistory,
    stopGeneration
  }
}
