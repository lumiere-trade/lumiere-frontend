"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useStrategy } from "@/contexts/StrategyContext"
import { useProphet } from "@/hooks/use-prophet"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useUpdateStrategy, useCreateConversation } from "@/hooks/mutations/use-architect-mutations"
import { EmptyStateView } from "./_components/EmptyStateView"
import { ConversationView } from "./_components/ConversationView"
import { LibraryPreviewView } from "./_components/LibraryPreviewView"
import { useStrategyLoader } from "./_hooks/useStrategyLoader"
import { Spinner } from "@/components/ui/spinner"

const EXAMPLE_PROMPTS = [
  "Create a momentum strategy for SOL/USD",
  "Build a mean reversion strategy using RSI",
  "Design a breakout strategy",
  "Make a scalping strategy with tight stops",
]

function CreatePageContent() {
  const logger = useLogger('CreatePage', LogCategory.COMPONENT)
  const searchParams = useSearchParams()
  const strategyId = searchParams.get('strategy')
  const libraryId = searchParams.get('library')

  const {
    strategy,
    setStrategy,
    clearStrategy,
    isGeneratingStrategy,
    strategyGenerationProgress,
    progressStage,
    progressMessage,
    openDetailsPanel,
    isDirty,
    registerStopProphet,
    isLoadingStrategy,
  } = useStrategy()

  const {
    messages,
    sendMessage,
    isSending,
    isHealthy,
    error,
    stopGeneration,
  } = useProphet()

  const updateStrategyMutation = useUpdateStrategy()
  const createConversationMutation = useCreateConversation()

  const [inputValue, setInputValue] = useState("")

  // Register Prophet stop callback with StrategyContext
  useEffect(() => {
    registerStopProphet(stopGeneration)
  }, [registerStopProphet, stopGeneration])

  // Load strategy from URL
  useStrategyLoader({
    strategyId,
    libraryId,
    currentStrategy: strategy,
    setStrategy,
    clearStrategy,
    openDetailsPanel,
  })

  // Auto-open details panel for user strategies without conversation
  useEffect(() => {
    if (strategy && strategyId && !libraryId && messages.length === 0 && !isLoadingStrategy) {
      openDetailsPanel()
    }
  }, [strategy, strategyId, libraryId, messages.length, isLoadingStrategy, openDetailsPanel])

  // Browser beforeunload warning + auto-save on unmount
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (isDirty && strategy && strategy.id) {
        logger.info('Auto-saving strategy on unmount', { strategyId: strategy.id })

        updateStrategyMutation.mutateAsync({
          strategyId: strategy.id,
          updates: {
            name: strategy.name,
            description: strategy.description,
            tsdl_code: JSON.stringify(strategy.tsdl, null, 2),
            base_plugins: strategy.basePlugins,
            parameters: strategy.tsdl
          }
        }).then(() => {
          if (strategy.conversation.messages.length > 0) {
            return createConversationMutation.mutateAsync({
              strategy_id: strategy.id!,
              messages: strategy.conversation.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp.toISOString()
              }))
            })
          }
        }).then(() => {
          logger.info('Auto-save on unmount completed')
        }).catch(err => {
          logger.error('Auto-save on unmount failed', { error: err })
        })
      }
    }
  }, [isDirty, strategy])

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

  const handleStop = () => {
    logger.info('Stop generation requested')
    stopGeneration()
  }

  const handleViewStrategy = () => {
    logger.info('View strategy clicked')
    openDetailsPanel()
  }

  // Determine which view to show
  const hasMessages = messages.length > 0
  const isLibraryPreview = libraryId && strategy && !hasMessages && !isLoadingStrategy

  // Loading state - show spinner while fetching strategy
  if (isLoadingStrategy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8 mb-4" />
        <p className="text-sm text-muted-foreground">Loading strategy...</p>
      </div>
    )
  }

  // View routing
  if (hasMessages) {
    return (
      <ConversationView
        messages={messages}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        onStop={handleStop}
        isSending={isSending}
        isHealthy={isHealthy}
        isGeneratingStrategy={isGeneratingStrategy}
        strategyGenerationProgress={strategyGenerationProgress}
        progressStage={progressStage}
        progressMessage={progressMessage}
        error={error}
        generatedStrategy={strategy}
        onViewStrategy={handleViewStrategy}
      />
    )
  }

  if (isLibraryPreview) {
    return (
      <LibraryPreviewView
        strategy={strategy}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        onViewStrategy={handleViewStrategy}
        isHealthy={isHealthy}
        isSending={isSending}
      />
    )
  }

  // Default: Empty state (includes user strategies without conversation)
  return (
    <EmptyStateView
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSend={handleSend}
      isHealthy={isHealthy}
      isSending={isSending}
      examplePrompts={EXAMPLE_PROMPTS}
    />
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  )
}
