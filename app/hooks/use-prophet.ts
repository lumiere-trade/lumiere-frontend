import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
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
    messages,
    setMessages,
    conversationId,
    setConversationId,
    conversationState,
    setConversationState,
    isGeneratingStrategy,
    setIsGeneratingStrategy,
    setStrategyGenerationProgress,
    setProgressStage,
    setProgressMessage,
    setGeneratedStrategy,
    setStrategyMetadata,
    openDetailsPanel,
    setDetailsPanelTab
  } = useChat()

  const [isStreaming, setIsStreaming] = useState(false)
  const log = useLogger('useProphet', LogCategory.HOOK)

  // Health check query
  const { data: healthData, error: healthError } = useProphetHealthQuery()
  const isHealthy = healthData?.status === 'healthy'

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    log.info('Sending message', { message, conversationId })

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])

    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages([...messages, userMessage, assistantMessage])
    setIsStreaming(true)

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
        }))
      },
      // onToken
      (token: string) => {
        fullResponse += token
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullResponse, isStreaming: true }
              : msg
          )
        )
      },
      // onProgress
      (progress: ProgressEvent) => {
        log.info('Strategy generation progress', progress)
        setIsGeneratingStrategy(true)
        setStrategyGenerationProgress(progress.percent)
        setProgressStage(progress.stage)
        setProgressMessage(progress.message)
      },
      // onStrategyGenerated - NEW FLAT SCHEMA
      (strategy: StrategyGeneratedEvent) => {
        log.info('Strategy generated', {
          strategyId: strategy.strategy_id,
          strategyName: strategy.strategy_name,
          indicators: strategy.strategy_json.indicators,
          pythonCodeLength: strategy.python_code.length
        })

        // Hide progress
        setIsGeneratingStrategy(false)
        setStrategyGenerationProgress(0)

        // Store flat JSON strategy
        setStrategyMetadata(strategy.strategy_json)

        // Store for display
        setGeneratedStrategy({
          id: strategy.strategy_id,
          name: strategy.strategy_name,
          strategy_json: strategy.strategy_json,
          python_code: strategy.python_code,
          strategy_class_name: strategy.strategy_class_name
        })

        // Open details panel
        openDetailsPanel()
        setDetailsPanelTab('parameters')

        // Mark message as having strategy
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, hasStrategy: true }
              : msg
          )
        )

        log.info('Strategy stored in context', {
          strategyId: strategy.strategy_id
        })
      },
      // onComplete
      (fullMessage: string, convId: string, state: string) => {
        log.info('Message complete', {
          conversationId: convId,
          state,
          messageLength: fullMessage.length
        })

        setConversationId(convId)
        setConversationState(state)
        setIsStreaming(false)

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullMessage, isStreaming: false }
              : msg
          )
        )
      },
      // onError
      (error: Error) => {
        log.error('Prophet error', { error })
        setIsStreaming(false)
        setIsGeneratingStrategy(false)

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: `Error: ${error.message}`,
                  isStreaming: false
                }
              : msg
          )
        )
      }
    )
  }

  // Stub functions for backward compatibility with create page
  const loadHistory = async () => {
    log.warn('loadHistory is deprecated - history loads via ChatContext')
  }

  const stopGeneration = () => {
    log.warn('stopGeneration not yet implemented')
  }

  return {
    messages,
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
