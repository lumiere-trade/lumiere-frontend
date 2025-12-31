"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useStrategy } from "@/contexts/StrategyContext"
import { useProphet } from "@/hooks/use-prophet"
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

  useEffect(() => {
    registerStopProphet(stopGeneration)
  }, [registerStopProphet, stopGeneration])

  const { educationalContent } = useStrategyLoader({
    strategyId,
    libraryId,
    currentStrategy: strategy,
    setStrategy,
    clearStrategy,
    openDetailsPanel,
  })

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
        }).catch(err => {
          console.error('Auto-save on unmount failed', err)
        })
      }
    }
  }, [isDirty, strategy])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !isHealthy) return

    const userMessage = inputValue.trim()
    setInputValue("")

    try {
      await sendMessage(userMessage)
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  const handleStop = () => {
    stopGeneration()
  }

  const handleViewStrategy = () => {
    openDetailsPanel()
  }

  if (isLoadingStrategy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8 mb-4" />
        <p className="text-sm text-muted-foreground">Loading strategy...</p>
      </div>
    )
  }

  // View routing based on actual state, not URL params
  // This allows conversation to work even when strategy.id is null

  // Active conversation (has messages)
  if (messages.length > 0) {
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

  // Library template preview (has strategy but no messages)
  if (libraryId && strategy && messages.length === 0) {
    return (
      <LibraryPreviewView
        strategy={strategy}
        educationalContent={educationalContent}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        onViewStrategy={handleViewStrategy}
        isHealthy={isHealthy}
        isSending={isSending}
      />
    )
  }

  // Default: Empty state (new strategy, no messages)
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
