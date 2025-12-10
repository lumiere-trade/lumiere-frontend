"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { StrategyParameters } from "@/components/strategy/StrategyParameters"
import { MessageInput } from "@/components/strategy/MessageInput"
import { ExamplePrompts } from "@/components/strategy/ExamplePrompts"
import { MessageList } from "@/components/strategy/MessageList"
import { useChat } from "@/contexts/ChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { getStrategy, getStrategyConversations, getConversation } from "@/lib/api/architect"
import { useProphet } from "@/hooks/use-prophet"
import { toast } from "sonner"

const EXAMPLE_PROMPTS = [
  "Create a momentum strategy for SOL/USD",
  "Build a mean reversion strategy using RSI",
  "Design a breakout strategy for volatile tokens",
  "Copy a successful whale wallet's trades",
]

function CreatePageContent() {
  const logger = useLogger('CreatePage', LogCategory.COMPONENT)
  const searchParams = useSearchParams()
  const strategyId = searchParams.get('strategy')

  const {
    generatedStrategy,
    currentStrategy,
    setGeneratedStrategy,
    setStrategyMetadata,
    setCurrentStrategy,
    clearChat,
    isGeneratingStrategy,
    strategyGenerationProgress,
    progressStage,
    progressMessage,
  } = useChat()

  const {
    messages,
    sendMessage,
    isSending,
    isHealthy,
    error,
    loadHistory,
  } = useProphet()

  const [inputValue, setInputValue] = useState("")

  // Load strategy when strategyId changes
  useEffect(() => {
    if (strategyId) {
      const isDifferentStrategy = !currentStrategy || currentStrategy.id !== strategyId

      if (isDifferentStrategy) {
        logger.info('Loading strategy', { strategyId })
        loadStrategy(strategyId)
      }
    } else if (!strategyId && generatedStrategy) {
      logger.info('Clearing chat state')
      clearChat()
    }
  }, [strategyId])

  const loadStrategy = async (id: string) => {
    try {
      const strategy = await getStrategy(id)

      setGeneratedStrategy({
        name: strategy.name,
        description: strategy.description,
        tsdl_code: strategy.tsdl_code,
        metadata: strategy.parameters
      })

      const updatedMetadata = mergeParameterValues(strategy.parameters)
      setStrategyMetadata(updatedMetadata)

      setCurrentStrategy({
        id: strategy.id,
        name: strategy.name,
        tsdl_code: strategy.tsdl_code,
        updated_at: strategy.updated_at,
      })

      await loadConversationHistory(id)

      toast.success(`Strategy "${strategy.name}" loaded`)
    } catch (error) {
      logger.error('Failed to load strategy', { error })
      toast.error('Failed to load strategy')
    }
  }

  const mergeParameterValues = (parameters: any) => {
    if (!parameters) return null

    const updatedValues = parameters.values || {}

    const metadata = {
      indicators: JSON.parse(JSON.stringify(parameters.indicators || [])),
      asset: JSON.parse(JSON.stringify(parameters.asset || {})),
      exit_conditions: JSON.parse(JSON.stringify(parameters.exit_conditions || {})),
      risk_management: JSON.parse(JSON.stringify(parameters.risk_management || {})),
      position_sizing: JSON.parse(JSON.stringify(parameters.position_sizing || {})),
      entry_description: parameters.entry_description || null,
      exit_description: parameters.exit_description || null
    }

    metadata.indicators?.forEach((indicator: any) => {
      Object.keys(indicator.params || {}).forEach((paramName) => {
        const key = `indicator_${indicator.name}_${paramName}`
        if (key in updatedValues) {
          indicator.params[paramName].value = updatedValues[key]
        }
      })
    })

    Object.keys(metadata.asset).forEach((fieldName) => {
      const key = `asset_${fieldName}`
      if (key in updatedValues) {
        metadata.asset[fieldName].value = updatedValues[key]
      }
    })

    Object.keys(metadata.exit_conditions).forEach((fieldName) => {
      const key = `exit_${fieldName}`
      if (key in updatedValues) {
        metadata.exit_conditions[fieldName].value = updatedValues[key]
      }
    })

    Object.keys(metadata.risk_management).forEach((fieldName) => {
      const key = `risk_${fieldName}`
      if (key in updatedValues) {
        metadata.risk_management[fieldName].value = updatedValues[key]
      }
    })

    Object.keys(metadata.position_sizing).forEach((fieldName) => {
      const key = `position_${fieldName}`
      if (key in updatedValues) {
        metadata.position_sizing[fieldName].value = updatedValues[key]
      }
    })

    return metadata
  }

  const loadConversationHistory = async (strategyId: string) => {
    try {
      const { conversations } = await getStrategyConversations(strategyId)

      if (conversations.length === 0) return

      const latestConversation = conversations.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      const fullConversation = await getConversation(latestConversation.id)
      loadHistory(fullConversation)

      logger.info('Conversation history loaded', {
        messageCount: fullConversation.messages.length
      })
    } catch (error) {
      logger.error('Failed to load conversation history', { error })
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !isHealthy) return

    const userMessage = inputValue.trim()
    setInputValue("")

    logger.info('Sending message', { messageLength: userMessage.length })

    try {
      await sendMessage(userMessage)
    } catch (err) {
      logger.error('Failed to send message', { error: err })
    }
  }

  // Determine view state
  const hasMessages = messages.length > 0
  const hasStrategy = !!generatedStrategy

  // Show strategy parameters
  if (hasStrategy) {
    return (
      <div className="py-8">
        <StrategyParameters strategy={generatedStrategy} />
      </div>
    )
  }

  // Show conversation view
  if (hasMessages) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-120px)]">
        <MessageList
          messages={messages}
          isSending={isSending}
          isGeneratingStrategy={isGeneratingStrategy}
          strategyGenerationProgress={strategyGenerationProgress}
          progressStage={progressStage}
          progressMessage={progressMessage}
          error={error}
        />

        <div className="sticky bottom-0 w-full border-t border-primary/20 bg-background/95 backdrop-blur-sm">
          <div className="w-full max-w-3xl mx-auto px-6 py-4">
            <MessageInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={!isHealthy || isSending}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show empty state
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Ready to create your strategy?
          </h1>
        </div>

        <MessageInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={!isHealthy || isSending}
        />

        <ExamplePrompts
          prompts={EXAMPLE_PROMPTS}
          onSelect={setInputValue}
          disabled={isSending}
        />

        {!isHealthy && (
          <div className="text-center">
            <p className="text-sm text-destructive">
              Prophet AI is not responding. Please check the connection.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  )
}
