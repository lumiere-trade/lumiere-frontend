"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MessageInput } from "@/components/strategy/MessageInput"
import { ExamplePrompts } from "@/components/strategy/ExamplePrompts"
import { MessageList } from "@/components/strategy/MessageList"
import { useChat } from "@/contexts/ChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { getStrategy, getStrategyConversations, getConversation, getLibraryStrategy } from "@/lib/api/architect"
import { useProphet } from "@/hooks/use-prophet"
import { toast } from "sonner"

const EXAMPLE_PROMPTS = [
  "Create a momentum strategy for SOL/USD",
  "Build a mean reversion strategy using RSI",
  "Design a breakout strategy",
  "Copy a successful whale wallet's trades",
]

function CreatePageContent() {
  const logger = useLogger('CreatePage', LogCategory.COMPONENT)
  const searchParams = useSearchParams()
  const strategyId = searchParams.get('strategy')
  const libraryId = searchParams.get('library')

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
    openDetailsPanel,
  } = useChat()

  const {
    messages,
    sendMessage,
    isSending,
    isHealthy,
    error,
    loadHistory,
    stopGeneration,
  } = useProphet()

  const [inputValue, setInputValue] = useState("")

  // Load strategy when strategyId or libraryId changes
  useEffect(() => {
    if (strategyId) {
      const isDifferentStrategy = !currentStrategy || currentStrategy.id !== strategyId

      if (isDifferentStrategy) {
        logger.info('Loading user strategy', { strategyId })
        loadStrategy(strategyId)
      }
    } else if (libraryId) {
      logger.info('Loading library strategy', { libraryId })
      loadLibraryStrategy(libraryId)
    } else if (!strategyId && !libraryId && generatedStrategy) {
      logger.info('Clearing chat state')
      clearChat()
    }
  }, [strategyId, libraryId])

  const loadStrategy = async (id: string) => {
    try {
      const strategy = await getStrategy(id)

      // Parse TSDL code to StrategyJSON
      const strategyJson = JSON.parse(strategy.tsdl_code)

      setGeneratedStrategy({
        name: strategy.name,
        description: strategy.description,
        tsdl_code: strategy.tsdl_code,
        metadata: strategy.parameters
      })

      // Directly use flat StrategyJSON from parameters
      setStrategyMetadata(strategyJson)

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

  const loadLibraryStrategy = async (id: string) => {
    try {
      const lib = await getLibraryStrategy(id)

      // Convert library strategy to TSDL v2.0 JSON format
      const strategyJson = {
        name: lib.name,
        description: lib.description,
        symbol: lib.symbol,
        timeframe: lib.timeframe,
        indicators: lib.indicators,
        entry_rules: lib.entry_rules,
        entry_logic: lib.entry_logic,
        exit_rules: lib.exit_rules,
        exit_logic: lib.exit_logic,
        // Spread flat parameters (stop_loss, take_profit, etc.)
        ...lib.parameters,
      }

      const tsdlCode = JSON.stringify(strategyJson, null, 2)

      setGeneratedStrategy({
        name: lib.name,
        description: lib.description,
        tsdl_code: tsdlCode,
        metadata: lib.parameters
      })

      // Directly use flat StrategyJSON
      setStrategyMetadata(strategyJson as any)

      // No currentStrategy (library template, not saved)
      setCurrentStrategy(null)

      toast.success(`Library strategy "${lib.name}" loaded as template`)

      // Automatically open details panel to show the strategy
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      logger.error('Failed to load library strategy', { error })
      toast.error('Failed to load library strategy')
    }
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

  const handleStop = () => {
    logger.info('Stop generation requested')
    stopGeneration()
  }

  const handleViewStrategy = () => {
    logger.info('View strategy clicked')
    openDetailsPanel()
  }

  // Determine view state
  const hasMessages = messages.length > 0
  // Only show library preview when NO messages exist
  const hasLoadedLibraryStrategy = !strategyId && libraryId && generatedStrategy && !hasMessages

  // Show conversation view (takes priority over library preview)
  if (hasMessages) {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)', scrollbarGutter: 'stable' }}>
        <div className="flex-1 pb-4">
          <MessageList
            messages={messages}
            isSending={isSending}
            isGeneratingStrategy={isGeneratingStrategy}
            strategyGenerationProgress={strategyGenerationProgress}
            progressStage={progressStage}
            progressMessage={progressMessage}
            error={error}
            generatedStrategy={generatedStrategy}
            onViewStrategy={handleViewStrategy}
          />
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm">
          <div className="w-full max-w-3xl mx-auto px-6 py-4">
            <MessageInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onStop={handleStop}
              disabled={!isHealthy}
              isSending={isSending}
              placeholder="Reply..."
              autoFocus={true}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show library strategy preview (no messages, but has loaded library)
  if (hasLoadedLibraryStrategy) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-80px)]">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                {generatedStrategy.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {generatedStrategy.description}
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={handleViewStrategy}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  View Strategy Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm">
          <div className="w-full max-w-3xl mx-auto px-6 py-4">
            <MessageInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={!isHealthy || isSending}
              placeholder="Ask Prophet to modify this strategy..."
            />
            {!isHealthy && (
              <p className="text-center text-sm text-destructive mt-2">
                Prophet AI is not responding. Please check the connection.
              </p>
            )}
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
