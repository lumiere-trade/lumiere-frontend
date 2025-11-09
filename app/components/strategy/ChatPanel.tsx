"use client"

import { useState, useEffect } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Sparkles, MessageSquare, Send, X } from "lucide-react"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

interface Message {
  role: "user" | "assistant"
  content: string
  isThinking?: boolean
}

interface ChatPanelProps {
  onStrategyGenerated: (strategy: any) => void
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
}

export function ChatPanel({ onStrategyGenerated, isExpanded, onExpand, onCollapse }: ChatPanelProps) {
  const log = useLogger('ChatPanel', LogCategory.COMPONENT)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      log.info('Chat panel opened', { messagesCount: messages.length })
    } else {
      log.info('Chat panel closed')
    }
  }, [isExpanded])

  const handleExpand = () => {
    log.info('Expand triggered - opening chat panel')
    onExpand()
  }

  const handleCollapse = () => {
    log.info('Collapse triggered - closing chat panel')
    onCollapse()
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) {
      log.warn('Send blocked', {
        reason: !inputValue.trim() ? 'empty input' : 'already generating',
        inputLength: inputValue.length
      })
      return
    }

    const userMessage = inputValue.trim()
    setInputValue("")

    log.info('User sent message', {
      message: userMessage,
      messageLength: userMessage.length,
      messagePreview: userMessage.substring(0, 50)
    })

    setMessages(prev => {
      const newMessages = [...prev, { role: "user" as const, content: userMessage }]
      log.debug('Messages state updated', {
        totalMessages: newMessages.length,
        userMessages: newMessages.filter(m => m.role === 'user').length
      })
      return newMessages
    })

    if (userMessage.toLowerCase().includes("generate strategy")) {
      log.info('Strategy generation triggered')
      log.time('strategy-generation')
      setIsGenerating(true)

      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Generating your strategy...",
        isThinking: true
      }])

      setTimeout(() => {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isThinking)
          log.debug('Removed thinking message', { remainingMessages: filtered.length })
          return filtered
        })

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

        log.timeEnd('strategy-generation')
        log.info('Strategy generated successfully', {
          strategyName: mockStrategy.name,
          strategyType: mockStrategy.type,
          parameters: mockStrategy.parameters
        })

        onStrategyGenerated(mockStrategy)
        setIsGenerating(false)
        handleCollapse()
        setMessages([])
        log.info('Chat cleared and closed after strategy generation')
      }, 3000)
    } else {
      log.info('Regular conversation message - generating AI response')
      setTimeout(() => {
        const responses = [
          "I understand. Could you tell me more about your trading preferences?",
          "That's interesting. What timeframe are you targeting for this strategy?",
          "Great! What risk level are you comfortable with?",
        ]
        const response = responses[Math.floor(Math.random() * responses.length)]

        log.debug('AI response generated', { responsePreview: response.substring(0, 50) })

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
      log.debug('Enter key pressed - sending message')
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    if (e.target.value.length % 50 === 0 && e.target.value.length > 0) {
      log.debug('Input length milestone', { length: e.target.value.length })
    }
  }

  return (
    <div className="fixed bottom-0 z-50 pointer-events-auto" style={{ left: 0, right: 0 }}>
      <div className="max-w-5xl mx-auto space-y-4 px-6 pb-6">
        {isExpanded && (
          <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-primary/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Prophet AI</h2>
                  <p className="text-sm text-muted-foreground">Strategy Creation Assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCollapse}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-[460px] px-6 py-4 space-y-4 overflow-y-auto">
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
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.isThinking
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-background border border-primary/20"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <MessageSquare className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onClick={handleExpand}
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
  )
}
