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

interface Message {
  role: "user" | "assistant"
  content: string
  isThinking?: boolean
}

export default function CreatePage() {
  const log = useLogger('CreatePage', LogCategory.COMPONENT)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

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
  }

  const handleTextareaClick = () => {
    if (!isChatOpen) {
      handleOpenChat()
    }
  }

  const handleTextareaFocus = () => {
    if (!isChatOpen) {
      handleOpenChat()
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage = inputValue.trim()
    setInputValue("")
    
    log.info('User sent message', { message: userMessage })
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }])

    if (userMessage.toLowerCase().includes("generate strategy")) {
      log.info('Strategy generation triggered')
      setIsGenerating(true)
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Generating your strategy...",
        isThinking: true 
      }])

      setTimeout(() => {
        setMessages(prev => prev.filter(m => !m.isThinking))
        
        const strategyMessage = `I've created an RSI-based momentum strategy for you. Here's what I've set up:

- **Strategy Name**: RSI Momentum Strategy
- **Buy Signal**: When RSI falls below 30 (oversold)
- **Sell Signal**: When RSI rises above 70 (overbought)
- **Take Profit**: 5% gain target
- **Stop Loss**: 2% maximum loss
- **Position Size**: 10% of available capital per trade

The strategy is ready for you to review and customize. You can adjust any parameters below.`

        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: strategyMessage 
        }])

        const mockStrategy = {
          name: "RSI Momentum Strategy",
          type: "indicator_based",
          parameters: {
            rsi_buy_threshold: 30,
            rsi_sell_threshold: 70,
            take_profit_percent: 5,
            stop_loss_percent: 2,
            position_size_percent: 10,
          },
          tsdl_code: `metadata:
  name: "RSI Momentum Strategy"
  strategy_composition:
    base_strategies:
      - indicator_based

strategy:
  entry:
    conditions:
      - indicator: RSI
        comparison: lt
        threshold: 30
  exit:
    conditions:
      - indicator: RSI
        comparison: gt
        threshold: 70
  risk:
    take_profit: 5%
    stop_loss: 2%
    position_size: 10%`
        }

        log.info('Strategy generated', { strategy: mockStrategy })
        handleStrategyGenerated(mockStrategy)
        handleCloseChat()
        setIsGenerating(false)
      }, 3000)
    } else {
      setTimeout(() => {
        const responses = [
          "I understand. Could you tell me more about your trading preferences?",
          "That's interesting. What timeframe are you targeting for this strategy?",
          "Great! What risk level are you comfortable with?",
        ]
        const response = responses[Math.floor(Math.random() * responses.length)]
        
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: response 
        }])
      }, 1000)
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
        className="fixed bottom-20 left-0 right-0 z-50 px-6 pointer-events-none"
        style={{
          marginLeft: '300px',
          width: 'calc(100vw - 300px)'
        }}
      >
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <MessageSquare className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onClick={handleTextareaClick}
              onFocus={handleTextareaFocus}
              onKeyDown={handleKeyDown}
              placeholder="How can I help you today?"
              rows={3}
              disabled={isGenerating}
              className="w-full pl-12 pr-14 pt-3 pb-4 rounded-2xl border border-primary/30 bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl text-base disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              className="absolute right-3 bottom-4 h-9 w-9 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProphetChatModal
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        messages={messages}
      />
    </>
  )
}
