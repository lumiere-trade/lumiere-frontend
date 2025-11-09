"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { ProphetChat } from "@/components/strategy/ProphetChat"
import { StrategyParameters } from "@/components/strategy/StrategyParameters"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

const examplePrompts = [
  "Create a momentum strategy for SOL/USD",
  "Build a mean reversion strategy using RSI",
  "Design a breakout strategy for volatile tokens",
  "Copy a successful whale wallet's trades",
]

export default function CreatePage() {
  const log = useLogger('CreatePage', LogCategory.COMPONENT)
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null)

  const handleStrategyGenerated = (strategy: any) => {
    log.info('Strategy generated and received', { strategy })
    setGeneratedStrategy(strategy)
  }

  return (
    <div className="relative min-h-[calc(100vh-134px)] pb-32">
      {generatedStrategy && (
        <div className="px-6 py-8">
          <StrategyParameters strategy={generatedStrategy} />
        </div>
      )}

      {!generatedStrategy && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
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

      <ProphetChat onStrategyGenerated={handleStrategyGenerated} />
    </div>
  )
}
