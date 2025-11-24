"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { StrategyParameters } from "@/components/strategy/StrategyParameters"
import { useChat } from "@/contexts/ChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { getStrategy, getStrategyConversations, getConversation } from "@/lib/api/architect"
import { useProphet } from "@/hooks/use-prophet"
import { toast } from "sonner"

const examplePrompts = [
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
    isChatExpanded,
    generatedStrategy,
    currentStrategy,
    collapseChat,
    expandChat,
    setInputValue,
    setGeneratedStrategy,
    setStrategyMetadata,
    setCurrentStrategy,
    clearChat,
  } = useChat()

  const { loadHistory } = useProphet()

  // Load strategy when strategyId changes or clear state when no strategyId
  useEffect(() => {
    if (strategyId) {
      // Check if we need to load a different strategy
      const isDifferentStrategy = !currentStrategy || currentStrategy.id !== strategyId
      
      if (isDifferentStrategy) {
        logger.info('Strategy ID changed, loading new strategy', {
          oldStrategyId: currentStrategy?.id,
          newStrategyId: strategyId
        })
        loadStrategy(strategyId)
      } else {
        logger.info('Same strategy ID, no reload needed', { strategyId })
      }
    } else if (!strategyId && generatedStrategy) {
      // Clear state when navigating to /create without strategy parameter
      logger.info('Clearing chat state for new strategy')
      clearChat()
    }
  }, [strategyId])

  const loadStrategy = async (id: string) => {
    try {
      logger.info('Loading strategy', { strategyId: id })
      const strategy = await getStrategy(id)

      // Set the loaded strategy in context
      setGeneratedStrategy({
        name: strategy.name,
        description: strategy.description,
        tsdl_code: strategy.tsdl_code,
        metadata: strategy.parameters
      })

      // Merge updated parameter values back into metadata structures
      const updatedMetadata = mergeParameterValues(strategy.parameters)

      // Set strategy metadata for parameter rendering
      setStrategyMetadata(updatedMetadata)

      // Set current strategy for Prophet context
      setCurrentStrategy({
        id: strategy.id,
        name: strategy.name,
        tsdl_code: strategy.tsdl_code,
        updated_at: strategy.updated_at,
      })

      logger.info('Strategy loaded successfully', {
        strategyId: strategy.id,
        strategyName: strategy.name,
        contextSet: true,
        hasUpdatedValues: !!strategy.parameters?.values
      })

      // Load conversation history
      await loadConversationHistory(id)

      toast.success(`Strategy "${strategy.name}" loaded`)
    } catch (error) {
      logger.error('Failed to load strategy', { error })
      toast.error('Failed to load strategy')
      console.error('Load strategy error:', error)
    }
  }

  const mergeParameterValues = (parameters: any) => {
    if (!parameters) return null

    const updatedValues = parameters.values || {}

    // Deep clone to avoid mutations
    const metadata = {
      indicators: JSON.parse(JSON.stringify(parameters.indicators || [])),
      asset: JSON.parse(JSON.stringify(parameters.asset || {})),
      exit_conditions: JSON.parse(JSON.stringify(parameters.exit_conditions || {})),
      risk_management: JSON.parse(JSON.stringify(parameters.risk_management || {})),
      position_sizing: JSON.parse(JSON.stringify(parameters.position_sizing || {})),
      entry_description: parameters.entry_description || null,
      exit_description: parameters.exit_description || null
    }

    // Merge indicator values
    metadata.indicators?.forEach((indicator: any) => {
      Object.keys(indicator.params || {}).forEach((paramName) => {
        const key = `indicator_${indicator.name}_${paramName}`
        if (key in updatedValues) {
          indicator.params[paramName].value = updatedValues[key]
        }
      })
    })

    // Merge asset values
    Object.keys(metadata.asset).forEach((fieldName) => {
      const key = `asset_${fieldName}`
      if (key in updatedValues) {
        metadata.asset[fieldName].value = updatedValues[key]
      }
    })

    // Merge exit conditions values
    Object.keys(metadata.exit_conditions).forEach((fieldName) => {
      const key = `exit_${fieldName}`
      if (key in updatedValues) {
        metadata.exit_conditions[fieldName].value = updatedValues[key]
      }
    })

    // Merge risk management values
    Object.keys(metadata.risk_management).forEach((fieldName) => {
      const key = `risk_${fieldName}`
      if (key in updatedValues) {
        metadata.risk_management[fieldName].value = updatedValues[key]
      }
    })

    // Merge position sizing values
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
      logger.info('Loading conversation history', { strategyId })

      const { conversations } = await getStrategyConversations(strategyId)

      if (conversations.length === 0) {
        logger.info('No conversation history found')
        return
      }

      // Get the most recent conversation
      const latestConversation = conversations.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      logger.info('Found conversation, fetching full details', {
        conversationId: latestConversation.id,
        messageCount: latestConversation.message_count,
      })

      // Fetch full conversation with messages
      const fullConversation = await getConversation(latestConversation.id)

      logger.info('Fetched full conversation', {
        conversationId: fullConversation.id,
        messagesCount: fullConversation.messages.length,
        state: fullConversation.state
      })

      // Load conversation history into Prophet hook
      loadHistory(fullConversation)

      logger.info('Conversation history loaded into chat', {
        messageCount: fullConversation.messages.length
      })
    } catch (error) {
      logger.error('Failed to load conversation history', { error })
      // Don't show error toast - history is optional
    }
  }

  const handlePageClick = () => {
    if (isChatExpanded) {
      collapseChat()
    }
  }

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt)
    expandChat()
  }

  return (
    <>
      {isChatExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={collapseChat}
        />
      )}

      <div
        className="relative min-h-[calc(100vh-120px)] pb-16"
        onClick={handlePageClick}
      >
        <div className={isChatExpanded ? 'pointer-events-none' : ''}>
          {generatedStrategy && (
            <div className="py-8">
              <StrategyParameters strategy={generatedStrategy} />
            </div>
          )}

          {!generatedStrategy && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-foreground">
                  Ready to create your strategy?
                </h1>

                <p className="text-lg text-muted-foreground">
                  Describe your trading idea in natural language
                </p>

                <div className="space-y-3 pt-4 max-w-2xl mx-auto">
                  <p className="text-sm text-muted-foreground">Try one of these:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {examplePrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptClick(prompt)}
                        className="rounded-xl border border-primary/20 bg-card/50 px-4 py-2.5 text-sm text-left transition-all hover:border-primary/40 hover:bg-card"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  )
}
