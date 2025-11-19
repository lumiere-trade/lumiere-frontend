"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { StrategyParameters } from "@/components/strategy/StrategyParameters"
import { useCreateChat } from "@/contexts/CreateChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { getStrategy } from "@/lib/api/architect"
import { toast } from "sonner"

const examplePrompts = [
  "Create a momentum strategy for SOL/USD",
  "Build a mean reversion strategy using RSI",
  "Design a breakout strategy for volatile tokens",
  "Copy a successful whale wallet's trades",
]

export default function CreatePage() {
  const log = useLogger('CreatePage', LogCategory.COMPONENT)
  const searchParams = useSearchParams()
  const strategyId = searchParams.get('strategy')
  
  const { 
    isChatExpanded, 
    generatedStrategy, 
    collapseChat, 
    expandChat, 
    setInputValue,
    setGeneratedStrategy 
  } = useCreateChat()

  // Load strategy on mount if strategyId is present
  useEffect(() => {
    if (strategyId && !generatedStrategy) {
      loadStrategy(strategyId)
    }
  }, [strategyId])

  const loadStrategy = async (id: string) => {
    try {
      log('Loading strategy', { strategyId: id })
      const strategy = await getStrategy(id)
      
      // Set the loaded strategy in context
      setGeneratedStrategy({
        name: strategy.name,
        description: strategy.description,
        tsdl_code: strategy.tsdl_code,
        metadata: strategy.parameters
      })
      
      log('Strategy loaded successfully', { strategy })
      toast.success('Strategy loaded')
    } catch (error) {
      log('Failed to load strategy', { error })
      toast.error('Failed to load strategy')
      console.error('Load strategy error:', error)
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
