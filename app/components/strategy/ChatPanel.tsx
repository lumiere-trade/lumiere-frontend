"use client"

import { useEffect, useRef } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { Sparkles, MessageSquare, Send, X } from "lucide-react"
import { useCreateChat } from "@/contexts/CreateChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useProphet } from "@/hooks/use-prophet"

interface ChatPanelProps {
  isSidebarOpen: boolean
}

export function ChatPanel({ isSidebarOpen }: ChatPanelProps) {
  const log = useLogger('ChatPanel', LogCategory.COMPONENT)
  const { isChatExpanded, expandChat, collapseChat, setGeneratedStrategy, inputValue, setInputValue } = useCreateChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // Auto-scroll to bottom when chat opens
  useEffect(() => {
    if (isChatExpanded) {
      log.info('Chat panel opened', {
        messagesCount: messages.length,
        prophetHealthy: isHealthy,
        tsdlVersion,
        plugins: pluginsLoaded,
      })

      // Scroll to bottom after chat opens (small delay for render)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      log.info('Chat panel closed')
    }
  }, [isChatExpanded, isHealthy, tsdlVersion, pluginsLoaded])

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

      // Check if Prophet generated TSDL code
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

          // Just collapse the chat, keep the history
          setTimeout(() => {
            collapseChat()
            log.info('Chat collapsed after strategy generation - history preserved')
          }, 1000)
        }
      }
    } catch (err) {
      log.error('Failed to send message to Prophet', {
        error: err instanceof Error ? err.message : 'Unknown error',
        userMessage: userMessage.substring(0, 50)
      })
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isChatExpanded && e.target === e.currentTarget) {
      collapseChat()
    }
  }

  const handleNewChat = () => {
    log.info('Starting new chat - clearing previous conversation')
    clearMessages()
    setInputValue("")
  }

  // Filter out empty streaming messages
  const visibleMessages = messages.filter(msg => msg.content.trim().length > 0)

  return (
    <div
      className="fixed z-60 transition-all duration-300"
      style={{
        left: isSidebarOpen ? '300px' : '32px',
        right: 0,
        width: isSidebarOpen ? 'calc(100vw - 300px)' : '100vw',
        top: '80px',
        bottom: '64px'
      }}
      onClick={handleBackdropClick}
    >
      <div className="h-full flex flex-col-reverse max-w-5xl mx-auto px-6 pb-6 gap-4">
        {/* Message box - always visible at bottom */}
        <div className="flex-shrink-0 relative pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <MessageSquare className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onClick={expandChat}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={3}
            disabled={isSending || !isHealthy}
            className="w-full pl-12 pr-14 pt-3 pb-4 rounded-2xl border border-primary/30 bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-2xl text-base disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || !isHealthy}
            className="absolute right-3 bottom-4 h-9 w-9 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat history - above message box, only when expanded */}
        {isChatExpanded && (
          <div className="flex-1 flex flex-col bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto min-h-0" onClick={(e) => e.stopPropagation()}>
            {/* Header - fixed size */}
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

            {/* Messages area - flex-1 takes remaining space */}
            <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto min-h-0">
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

              {visibleMessages.map((message) => (
                <div
                  key={message.id}
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
                        : "bg-background border border-primary/20"
                    }`}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-line">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
                    <p className="text-base text-muted-foreground">
                      Prophet is thinking...
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

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
