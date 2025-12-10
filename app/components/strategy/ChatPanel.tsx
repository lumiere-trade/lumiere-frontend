"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Sparkles, Send, X, ArrowRight, ArrowDown, Plus } from "lucide-react"
import { useChat } from "@/contexts/ChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useProphet } from "@/hooks/use-prophet"
import { StrategyPreview } from "./StrategyPreview"
import { StrategyGenerationProgress } from "./StrategyGenerationProgress"
import { MarkdownMessage } from "./MarkdownMessage"

interface ChatPanelProps {
  isSidebarOpen: boolean
}

export function ChatPanel({ isSidebarOpen }: ChatPanelProps) {
  const log = useLogger('ChatPanel', LogCategory.COMPONENT)
  const {
    isChatExpanded,
    collapseChat,
    isGeneratingStrategy,
    strategyGenerationProgress,
    progressStage,
    progressMessage,
    generatedStrategy,
  } = useChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [thinkingText, setThinkingText] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isStrategyNew, setIsStrategyNew] = useState(false)
  const previousStrategyRef = useRef<any>(null)

  const {
    messages,
    clearMessages,
    isSending,
    isHealthy,
    conversationState,
    redisCache,
    error,
  } = useProphet()

  // Track strategy changes - mark as new when strategy changes
  useEffect(() => {
    if (generatedStrategy && generatedStrategy !== previousStrategyRef.current) {
      log.info('New strategy generated - marking as new')
      setIsStrategyNew(true)
      previousStrategyRef.current = generatedStrategy
    }
  }, [generatedStrategy, log])

  // Handle visibility and pre-scroll
  useEffect(() => {
    if (isChatExpanded) {
      setIsVisible(true)
      setIsReady(false)

      requestAnimationFrame(() => {
        if (messagesContainerRef.current && messages.length > 0) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
        requestAnimationFrame(() => {
          setIsReady(true)
        })
      })
    } else {
      setIsVisible(false)
      setIsReady(false)
    }
  }, [isChatExpanded, messages.length])

  // Thinking animation - only show if not generating strategy
  useEffect(() => {
    if (!isSending || isGeneratingStrategy) {
      setThinkingText("")
      return
    }

    const fullText = "Thinking..."
    let currentIndex = 0

    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setThinkingText(fullText.substring(0, currentIndex))
        currentIndex++
      } else {
        setTimeout(() => {
          setThinkingText("")
          currentIndex = 0
        }, 800)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isSending, isGeneratingStrategy])

  // Auto-scroll when new messages arrive or strategy generation updates
  useEffect(() => {
    if (isVisible && isReady && (messages.length > 0 || isSending || isGeneratingStrategy)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isSending, isGeneratingStrategy, isVisible, isReady])

  // Track scroll position to show/hide scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight

      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isAtBottom && messages.length > 0)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isChatExpanded) {
      log.info('Chat panel opened', {
        messagesCount: messages.length,
        prophetHealthy: isHealthy,
        redisCache,
      })
    } else {
      log.info('Chat panel closed')
    }
  }, [isChatExpanded, isHealthy, redisCache, messages.length, log])

  const handleViewStrategy = () => {
    log.info('View Strategy button clicked - marking strategy as viewed and closing chat')
    setIsStrategyNew(false)
    collapseChat()
  }

  const handleNewChat = () => {
    log.info('Starting new chat - clearing previous conversation')
    clearMessages()
    setIsStrategyNew(false)
    previousStrategyRef.current = null
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isChatExpanded && e.target === e.currentTarget) {
      collapseChat()
    }
  }

  // Only show messages with content (no empty streaming bubbles)
  const visibleMessages = messages.filter(msg => msg.content.trim().length > 0)

  // Show "Thinking..." only if streaming but no visible content yet AND not generating strategy
  const hasStreamingContent = messages.some(m => m.isStreaming && m.content.length > 0)
  const showThinking = isSending && !hasStreamingContent && !isGeneratingStrategy

  // Don't render anything if chat is not expanded
  if (!isChatExpanded || !isVisible) {
    return null
  }

  return (
    <div
      className="fixed z-60 transition-all duration-300"
      style={{
        left: isSidebarOpen ? '300px' : '32px',
        right: 0,
        width: isSidebarOpen ? 'calc(100vw - 300px)' : 'calc(100vw - 32px)',
        top: '80px',
        bottom: '32px'
      }}
      onClick={handleBackdropClick}
    >
      <div className="h-full flex flex-col max-w-5xl mx-auto px-6 gap-4">
        <div
          className="flex-1 flex flex-col bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto min-h-0 transition-all duration-200 ease-out opacity-100 translate-y-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={collapseChat}
              className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Container */}
          <div className="relative flex-1 min-h-0">
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className={`h-full px-6 py-6 space-y-4 ${visibleMessages.length > 0 || showThinking || isGeneratingStrategy ? 'overflow-y-auto' : 'overflow-hidden'}`}
              style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.05s' }}
            >
              {visibleMessages.length === 0 && !showThinking && !isGeneratingStrategy && (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">
                      Start by describing your trading strategy idea.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try: "Create an RSI strategy that buys when oversold"
                    </p>
                    {!isHealthy && (
                      <p className="text-xs text-destructive">
                        Warning: Prophet AI is not responding
                      </p>
                    )}
                  </div>
                </div>
              )}

              {visibleMessages.map((message) => (
                <div key={message.id}>
                  <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0 self-start mt-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.role === "user" ? "" : "w-full"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-primary/20"
                        }`}
                      >
                        {message.role === "user" ? (
                          <p className="text-base leading-relaxed whitespace-pre-line">
                            {message.content}
                          </p>
                        ) : (
                          <MarkdownMessage content={message.content} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Strategy Generation Progress - Prophet-driven */}
              {isGeneratingStrategy && (
                <StrategyGenerationProgress
                  progress={strategyGenerationProgress}
                  stage={progressStage}
                  message={progressMessage}
                />
              )}

              {/* Thinking Animation */}
              {showThinking && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0 self-start mt-1">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-base text-muted-foreground inline-block" style={{ minWidth: '100px' }}>
                      {thinkingText || '\u00A0'}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
                    <p className="text-base text-destructive">
                      Error: {error.message}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Floating scroll to bottom button */}
            {showScrollButton && (
              <Button
                size="icon"
                onClick={scrollToBottom}
                className="absolute bottom-6 right-6 h-10 w-10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Footer - Only Buttons */}
          <div className="flex-shrink-0 border-t border-primary/20 px-6 py-4 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              {/* View Strategy Button - Left */}
              {generatedStrategy ? (
                <Button
                  onClick={handleViewStrategy}
                  variant={isStrategyNew ? "default" : "outline"}
                  size="lg"
                  className="rounded-full px-6 font-semibold gap-2"
                >
                  View Strategy
                  <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <div />
              )}

              {/* New Chat Button - Right */}
              <Button
                onClick={handleNewChat}
                variant="outline"
                size="lg"
                className="rounded-full px-6 font-semibold gap-2"
              >
                <Plus className="h-5 w-5" />
                New Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
