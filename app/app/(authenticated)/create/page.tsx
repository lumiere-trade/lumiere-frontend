"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MessageInput } from "@/components/strategy/MessageInput"
import { ExamplePrompts } from "@/components/strategy/ExamplePrompts"
import { MessageList } from "@/components/strategy/MessageList"
import { useStrategy } from "@/contexts/StrategyContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { getStrategy, getStrategyConversations, getConversation, getLibraryStrategy } from "@/lib/api/architect"
import { useProphet } from "@/hooks/use-prophet"
import { toast } from "sonner"
import {
  useUpdateStrategy,
  useCreateConversation
} from "@/hooks/mutations/use-architect-mutations"

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
    isDirty
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

  // Load strategy when strategyId or libraryId changes
  useEffect(() => {
    if (strategyId) {
      const isDifferentStrategy = !strategy || strategy.id !== strategyId

      if (isDifferentStrategy) {
        logger.info('Loading user strategy', { strategyId })
        loadUserStrategy(strategyId)
      }
    } else if (libraryId) {
      logger.info('Loading library strategy', { libraryId })
      loadLibraryStrategy(libraryId)
    } else if (!strategyId && !libraryId && strategy) {
      logger.info('Clearing strategy state')
      clearStrategy()
    }
  }, [strategyId, libraryId])

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

      // Auto-save on component unmount if dirty and strategy exists
      if (isDirty && strategy && strategy.id) {
        logger.info('Auto-saving strategy on unmount', { strategyId: strategy.id })

        // Fire-and-forget save
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
          // Save conversation if exists
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

  const loadUserStrategy = async (id: string) => {
    try {
      const strategyData = await getStrategy(id)

      // Parse TSDL JSON from tsdl_code
      const tsdlJson = JSON.parse(strategyData.tsdl_code)

      // Load conversation history
      const { conversations } = await getStrategyConversations(id)
      let conversationData = {
        id: null as string | null,
        messages: [] as any[],
      }

      if (conversations.length > 0) {
        const latestConversation = conversations.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        const fullConversation = await getConversation(latestConversation.id)
        conversationData = {
          id: fullConversation.id,
          messages: fullConversation.messages.map(msg => ({
            id: msg.id || Date.now().toString(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            isStreaming: false,
            hasStrategy: false
          })),
        }

        logger.info('Conversation history loaded', {
          messageCount: conversationData.messages.length
        })
      }

      // Build Strategy object from database
      setStrategy({
        id: strategyData.id,
        name: strategyData.name,
        description: strategyData.description,
        tsdl: tsdlJson,
        status: strategyData.status,
        basePlugins: strategyData.base_plugins,
        version: strategyData.version,
        conversation: conversationData,
        createdAt: strategyData.created_at,
        updatedAt: strategyData.updated_at
      })

      toast.success(`Strategy "${strategyData.name}" loaded`)

      // Automatically open details panel to show the strategy
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      logger.error('Failed to load strategy', { error })
      toast.error('Failed to load strategy')
    }
  }

  const loadLibraryStrategy = async (id: string) => {
    try {
      const lib = await getLibraryStrategy(id)

      // Convert library strategy to MVP JSON format
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
        stop_loss: lib.parameters.stop_loss,
        take_profit: lib.parameters.take_profit,
        trailing_stop: lib.parameters.trailing_stop,
      }

      // MVP: All strategies are indicator-based
      const strategyType = 'indicator_based'

      // Build Strategy object from library
      setStrategy({
        id: null,
        name: lib.name,
        description: lib.description,
        tsdl: strategyJson as any,
        status: 'draft',
        basePlugins: [strategyType],
        version: '1.0.0',
        conversation: {
          id: null,
          messages: [],
        },
        createdAt: null,
        updatedAt: null
      })

      toast.success(`Library strategy "${lib.name}" loaded as template`)

      // Automatically open details panel to show the strategy
      setTimeout(() => openDetailsPanel(), 100)
    } catch (error) {
      logger.error('Failed to load library strategy', { error })
      toast.error('Failed to load library strategy')
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
  const hasLoadedLibraryStrategy = !strategyId && libraryId && strategy && !hasMessages

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
            generatedStrategy={strategy}
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
                {strategy.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {strategy.description}
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
