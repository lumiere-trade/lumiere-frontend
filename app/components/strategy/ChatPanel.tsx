"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Sparkles, MessageSquare, Send, X, ArrowRight } from "lucide-react"
import { useChat } from "@/contexts/ChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useProphet } from "@/hooks/use-prophet"
import { StrategyPreview } from "./StrategyPreview"
import { MarkdownMessage } from "./MarkdownMessage"

interface ChatPanelProps {
  isSidebarOpen: boolean
}

export function ChatPanel({ isSidebarOpen }: ChatPanelProps) {
  const log = useLogger('ChatPanel', LogCategory.COMPONENT)
  const { isChatExpanded, expandChat, collapseChat, setGeneratedStrategy, inputValue, setInputValue } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [thinkingText, setThinkingText] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null)
  const [wasAtBottom, setWasAtBottom] = useState(true)

  const {
    messages,
    sendMessage,
    clearMessages,
    isSending,
    isHealthy,
    tsdlVersion,
    pluginsLoaded,
    conversationState,
    error,
  } = useProphet()

  useEffect(() => {
    if (isChatExpanded) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isChatExpanded])

  useEffect(() => {
    if (!isSending) {
      setThinkingText("")
      return
    }

    const fullText = "Thinking..."
    let currentIndex = 0
    let isDeleting = false

    const interval = setInterval(() => {
      if (!isDeleting) {
        if (currentIndex <= fullText.length) {
          setThinkingText(fullText.substring(0, currentIndex))
          currentIndex++
        } else {
          setTimeout(() => {
            isDeleting = true
          }, 500)
        }
      } else {
        if (currentIndex > 0) {
          currentIndex--
          setThinkingText(fullText.substring(0, currentIndex))
        } else {
          isDeleting = false
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearInterval(interval)
  }, [isSending])

  // Auto-scroll only when new messages arrive AND user was at bottom
  useEffect(() => {
    if ((messages.length > 0 || isSending) && wasAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isSending, wasAtBottom])

  // Save scroll position when chat closes
  useEffect(() => {
    if (!isChatExpanded && messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      
      // Check if user was at bottom (within 50px threshold)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      
      setSavedScrollPosition(scrollTop)
      setWasAtBottom(isAtBottom)
      
      log.debug('Chat closing - saving scroll state', {
        scrollTop,
        scrollHeight,
        clientHeight,
        isAtBottom,
        messagesCount: messages.length
      })
    }
  }, [isChatExpanded, messages.length])

  // Restore scroll position when chat opens
  useEffect(() => {
    if (isChatExpanded) {
      log.info('Chat panel opened', {
        messagesCount: messages.length,
        prophetHealthy: isHealthy,
        tsdlVersion,
        plugins: pluginsLoaded,
        savedScrollPosition,
        wasAtBottom
      })

      if (messages.length > 0 && messagesContainerRef.current) {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            if (wasAtBottom || savedScrollPosition === null) {
              // User was at bottom or first open - scroll to bottom
              messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
              log.debug('Restored scroll to bottom')
            } else {
              // Restore saved position
              messagesContainerRef.current.scrollTop = savedScrollPosition
              log.debug('Restored scroll position', { position: savedScrollPosition })
            }
          }
        }, 50)
      }
    } else {
      log.info('Chat panel closed')
    }
  }, [isChatExpanded, isHealthy, tsdlVersion, pluginsLoaded])

  // Track if user is at bottom (for auto-scroll behavior)
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      
      if (isAtBottom !== wasAtBottom) {
        setWasAtBottom(isAtBottom)
        log.debug('Scroll position changed', { isAtBottom })
      }
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) {
      log.warn('Send blocked', {
        reason: !inputValue.trim() ? 'empty input' : 'already sending',
        inputLength: inputValue.length
      })
      return
    }

    const userMessage = inputValue.trim()
    setInputValue("")

    // Sending new message - user expects to see it at bottom
    setWasAtBottom(true)

    log.info('Sending message to Prophet', {
      message: userMessage,
      messageLength: userMessage.length,
      messagePreview: userMessage.substring(0, 50)
    })

    try {
      log.time('prophet-response')
      const response = await sendMessage(userMessage)
      log.timeEnd('prophet-response')

      log.info('Prophet response received', {
        conversationId: response.conversation_id,
        state: response.state,
        responseLength: response.message.length,
      })

      if (response.message.includes('```tsdl')) {
        log.info('TSDL code detected in response - extracting strategy')

        const tsdlMatch = response.message.match(/```tsdl\n([\s\S]*?)```/)
        if (tsdlMatch) {
          const tsdlCode = tsdlMatch[1]

          const nameMatch = tsdlCode.match(/STRATEGY ["']([^"']+)["']/)
          const strategyName = nameMatch ? nameMatch[1] : 'Generated Strategy'

          const mockStrategy = {
            name: strategyName,
            type: "indicator_based",
            parameters: {},
            tsdl_code: tsdlCode
          }

          log.info('Strategy extracted successfully', {
            strategyName: mockStrategy.name,
            tsdlLength: tsdlCode.length
          })

          setGeneratedStrategy(mockStrategy)

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      }
    } catch (err) {
      log.error('Failed to send message to Prophet', {
        error: err instanceof Error ? err.message : 'Unknown error',
        userMessage: userMessage.substring(0, 50)
      })
    }
  }

  const handleViewStrategy = () => {
    log.info('View Strategy button clicked - closing chat')
    collapseChat()
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isChatExpanded && e.target === e.currentTarget) {
      collapseChat()
    }
  }

  const handleNewChat = () => {
    log.info('Starting new chat - clearing previous conversation')
    clearMessages()
    setInputValue("")
    setSavedScrollPosition(null)
    setWasAtBottom(true)
  }

  const visibleMessages = messages.filter(msg => msg.content.trim().length > 0)

  const extractTSDL = (content: string) => {
    const match = content.match(/```tsdl\n([\s\S]*?)```/)
    return match ? match[1] : null
  }

  return (
    <div
      className={`fixed z-60 transition-all duration-300 ${!isChatExpanded ? 'pointer-events-none' : ''}`}
      style={{
        left: isSidebarOpen ? '300px' : '32px',
        right: 0,
        width: isSidebarOpen ? 'calc(100vw - 300px)' : 'calc(100vw - 32px)',
        top: '80px',
        bottom: '32px'
      }}
      onClick={handleBackdropClick}
    >
      <div className="h-full flex flex-col-reverse max-w-5xl mx-auto px-6 pb-6 gap-4">
        <div className="flex-shrink-0 relative pointer-events-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <MessageSquare className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onClick={expandChat}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={3}
            disabled={!isHealthy}
            className="w-full pl-12 pr-14 pt-3 pb-4 rounded-2xl border border-primary/30 bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl text-base disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || !isHealthy}
            className="absolute right-3 bottom-4 h-9 w-9 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {isVisible && (
          <div
            className={`flex-1 flex flex-col bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto min-h-0 transition-all duration-200 ease-out ${
              isChatExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between border-b border-primary/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Prophet AI</h2>
                  <p className="text-sm text-muted-foreground">
                    Strategy Creation Assistant
                    {isHealthy && tsdlVersion && (
                      <span className="ml-2 text-xs text-primary">
                        • TSDL {tsdlVersion} • {pluginsLoaded.length} plugins
                      </span>
                    )}
                    {conversationState && conversationState !== 'greeting' && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        • {conversationState}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewChat}
                    className="text-xs"
                  >
                    New Chat
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={collapseChat}
                  className="h-8 w-8 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className={`flex-1 px-6 py-4 space-y-4 min-h-0 ${visibleMessages.length > 0 || isSending ? 'overflow-y-auto' : 'overflow-hidden'}`}
            >
              {visibleMessages.length === 0 && !isSending && (
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

              {visibleMessages.map((message) => {
                const tsdlCode = message.role === "assistant" ? extractTSDL(message.content) : null
                const contentWithoutTSDL = tsdlCode
                  ? message.content.replace(/```tsdl\n[\s\S]*?```/, '').trim()
                  : message.content

                return (
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
                            <>
                              {contentWithoutTSDL && (
                                <MarkdownMessage content={contentWithoutTSDL} />
                              )}

                              {tsdlCode && (
                                <>
                                  {contentWithoutTSDL && <div className="my-3 border-t border-primary/20" />}
                                  <StrategyPreview tsdlCode={tsdlCode} />
                                </>
                              )}
                            </>
                          )}
                        </div>

                        {tsdlCode && (
                          <div className="mt-3">
                            <Button
                              onClick={handleViewStrategy}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              View Strategy
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0 self-start mt-1">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-base text-muted-foreground min-w-[80px]">
                      {thinkingText}
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
          </div>
        )}
      </div>
    </div>
  )
}
