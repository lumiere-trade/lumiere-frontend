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
import { useCreateConversation } from './mutations/use-architect-mutations'

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
    setDetailsPanelTab,
    setDirty
  } = useStrategy()

  const [isStreaming, setIsStreaming] = useState(false)
  const log = useLogger('useProphet', LogCategory.HOOK)

  // Health check query
  const { data: healthData, error: healthError } = useProphetHealthQuery()
  const isHealthy = healthData?.status === 'healthy'

  // Auto-save conversation mutation (fire-and-forget)
  const createConversationMutation = useCreateConversation()

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    // Extract conversation data from strategy
    const conversationId = strategy?.conversation.id
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
      
      // Auto-save conversation (fire-and-forget) if strategy exists
      if (strategy.id) {
        log.info('Auto-saving conversation', { strategyId: strategy.id })
        createConversationMutation.mutateAsync({
          strategy_id: strategy.id,
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          }))
        }).catch(err => {
          log.error('Conversation auto-save failed', { error: err })
        })
      }
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
          stop_loss: 3.0,
          take_profit: null,
          trailing_stop: null,
        },
        status: 'draft',
        basePlugins: ['indicator_based'],
        version: '1.0.0',
        conversation: {
          id: null,
          messages: newMessages
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

        // MVP: All strategies are indicator-based
        const strategyType = 'indicator_based'

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
              )
            },
            createdAt: null,
            updatedAt: null
          })
        }

        // Mark as dirty - Prophet generated new strategy
        setDirty(true)
        log.info('Strategy marked as dirty after Prophet generation')

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
      (fullMessage: string, convId: string) => {
        log.info('Message complete', {
          conversationId: convId,
          messageLength: fullMessage.length
        })

        setIsStreaming(false)

        // Update conversation with final ID
        updateConversation({
          id: convId,
          messages: newMessages.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullMessage, isStreaming: false }
              : msg
          )
        })

        // Auto-save conversation with final message (fire-and-forget)
        if (strategy?.id) {
          log.info('Auto-saving final conversation', { strategyId: strategy.id, convId })
          createConversationMutation.mutateAsync({
            strategy_id: strategy.id,
            messages: newMessages.map(msg => ({
              role: msg.role,
              content: msg.id === assistantMessage.id ? fullMessage : msg.content,
              timestamp: msg.timestamp.toISOString()
            }))
          }).catch(err => {
            log.error('Final conversation auto-save failed', { error: err })
          })
        }
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
