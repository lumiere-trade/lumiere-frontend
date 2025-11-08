"use client"

import { useState } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Sparkles, MessageSquare, Send } from "lucide-react"
import { ProphetChatModal } from "@/components/strategy/ProphetChatModal"
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
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null)
  const [inputValue, setInputValue] = useState("")

  const handleOpenChat = () => {
    log.info('Opening Prophet chat modal')
    setIsChatOpen(true)
  }

  const handleCloseChat = () => {
    log.info('Closing Prophet chat modal')
    setIsChatOpen(false)
  }

  const handleStrategyGenerated = (strategy: any) => {
    log.info('Strategy generated and received', { strategy })
    setGeneratedStrategy(strategy)
  }

  const handleExamplePrompt = (prompt: string) => {
    log.info('Example prompt selected', { prompt })
    setInputValue(prompt)
    handleOpenChat()
  }

  const handleTextareaClick = () => {
    handleOpenChat()
  }

  const handleTextareaFocus = () => {
    handleOpenChat()
  }

  const handleSend = () => {
    if (inputValue.trim()) {
      handleOpenChat()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
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
                      onClick={() => handleExamplePrompt(prompt)}
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

      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleCloseChat}
        />
      )}

      <div 
        className="fixed bottom-6 left-0 right-0 z-50 px-6"
        style={{
          marginLeft: '300px',
          width: 'calc(100vw - 300px)'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-muted-foreground pointer-events-none" />
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onClick={handleTextareaClick}
              onFocus={handleTextareaFocus}
              onKeyDown={handleKeyDown}
              placeholder="How can I help you today?"
              rows={3}
              className="w-full pl-12 pr-14 py-4 rounded-2xl border border-primary/30 bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-lg text-base"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="absolute right-3 bottom-3 h-9 w-9 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProphetChatModal
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onStrategyGenerated={handleStrategyGenerated}
      />
    </>
  )
}
