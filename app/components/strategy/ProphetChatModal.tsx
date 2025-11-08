"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@lumiere/shared/components/ui/dialog"
import { Button } from "@lumiere/shared/components/ui/button"
import { Sparkles, Send, Loader2 } from "lucide-react"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

interface Message {
  role: "user" | "assistant"
  content: string
  isThinking?: boolean
}

interface ProphetChatModalProps {
  isOpen: boolean
  onClose: () => void
  onStrategyGenerated: (strategy: any) => void
}

export function ProphetChatModal({ isOpen, onClose, onStrategyGenerated }: ProphetChatModalProps) {
  const log = useLogger('ProphetChatModal', LogCategory.COMPONENT)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput("")
    
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
        onStrategyGenerated(mockStrategy)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[80vh] p-0 gap-0 bg-card border-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">Prophet AI Chat</DialogTitle>
        
        <div className="flex flex-col h-[80vh]">
          <div className="flex items-center gap-3 border-b border-primary/20 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Prophet AI</h2>
              <p className="text-sm text-muted-foreground">Strategy Creation Assistant</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Start by describing your trading strategy idea.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try: "Generate strategy using RSI"
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
                    {message.isThinking ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.isThinking
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-card border border-primary/20"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-primary/20 p-4">
            <div className="relative">
              <textarea
                placeholder="Describe your strategy or type 'generate strategy'..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                className="w-full min-h-[80px] rounded-xl border border-primary/30 bg-background px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <Button
                size="icon"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-lg"
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
