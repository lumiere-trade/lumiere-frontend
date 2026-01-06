import { useState, useRef } from 'react'
import { useStrategy } from '@/contexts/StrategyContext'
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
  const abortControllerRef = useRef<AbortController | null>(null)

  // Health check query
  const { data: healthData, error: healthError } = useProphetHealthQuery()
  const isHealthy = healthData?.status === 'healthy'

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    // Extract conversation data from strategy
    const conversationId = strategy?.conversation.id
    const messages = strategy?.conversation.messages || []

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
        userId: null,
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

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    // Build strategy context if strategy exists
    let strategyContext = undefined
    if (strategy?.id) {
      strategyContext = {
        strategy_id: strategy.id,
        current_tsdl: JSON.stringify(strategy.tsdl, null, 2),
        strategy_name: strategy.name,
        last_updated: strategy.updatedAt
      }
    }

    let fullResponse = ''
    let strategyWasGenerated = false

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
        setIsGeneratingStrategy(true)
        setStrategyGenerationProgress(progress.percent)
        setProgressStage(progress.stage)
        setProgressMessage(progress.message)
      },
      // onStrategyGenerated - build Strategy from Prophet response
      (strategyEvent: StrategyGeneratedEvent) => {
        // Hide progress
        setIsGeneratingStrategy(false)
        setStrategyGenerationProgress(0)

        // Flag that strategy was generated (will open panel in onComplete)
        strategyWasGenerated = true

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
            userId: null,
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

        // Prophet generated new strategy - isDirty is now auto-calculated in Context
        // Set default tab to parameters
        setDetailsPanelTab('parameters')
      },
      // onComplete - message streaming complete
      (fullMessage: string, convId: string) => {
        setIsStreaming(false)
        abortControllerRef.current = null

        // Add strategy marker if strategy was generated
        const finalMessage = strategyWasGenerated
          ? `${fullMessage}\n\n<<view_strategy>>`
          : fullMessage

        // Update conversation with final ID and marker
        updateConversation({
          id: convId,
          messages: newMessages.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: finalMessage, isStreaming: false }
              : msg
          )
        })

        // Open details panel AFTER streaming completes if strategy was generated
        if (strategyWasGenerated) {
          openDetailsPanel()
        }
      },
      // onError - handle streaming errors
      (error: Error) => {
        setIsStreaming(false)
        setIsGeneratingStrategy(false)
        abortControllerRef.current = null

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
      },
      // signal - AbortSignal for cancellation
      abortControllerRef.current.signal
    )
  }

  // Deprecated - conversation history loads via StrategyContext
  const loadHistory = async () => {
    console.warn('loadHistory is deprecated - history loads via StrategyContext')
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      setIsGeneratingStrategy(false)
      setStrategyGenerationProgress(0)
    }
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
