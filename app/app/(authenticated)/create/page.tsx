"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { StrategyParameters } from "@/components/strategy/StrategyParameters"
import { useChat } from "@/contexts/ChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { getStrategy, getStrategyConversations } from "@/lib/api/architect"
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
    collapseChat, 
    expandChat, 
    setInputValue,
    setGeneratedStrategy,
    setStrategyMetadata
  } = useChat()

  const { loadHistory } = useProphet()

  // Load strategy on mount if strategyId is present
  useEffect(() => {
    if (strategyId && !generatedStrategy) {
      loadStrategy(strategyId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Set strategy metadata for parameter rendering
      if (strategy.parameters) {
        setStrategyMetadata({
          indicators: strategy.parameters.indicators || [],
          asset: strategy.parameters.asset || {},
          exit_conditions: strategy.parameters.exit_conditions || {},
          risk_management: strategy.parameters.risk_management || {},
          position_sizing: strategy.parameters.position_sizing || {}
        })
      }
      
      logger.info('Strategy loaded successfully', { strategy })

      // Load conversation history
      await loadConversationHistory(id)
      
      toast.success('Strategy loaded')
    } catch (error) {
      logger.error('Failed to load strategy', { error })
      toast.error('Failed to load strategy')
      console.error('Load strategy error:', error)
    }
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

      logger.info('Found conversation history', {
        conversationId: latestConversation.id,
        messageCount: latestConversation.message_count,
        state: latestConversation.state
      })

      // Load conversation history into Prophet hook
      loadHistory(latestConversation)
      
      logger.info('Conversation history loaded into chat', {
        messageCount: latestConversation.messages.length
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
