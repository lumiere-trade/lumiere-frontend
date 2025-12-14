"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, ArrowDown } from "lucide-react"
import { Message } from "./Message"
import { StrategyGenerationProgress } from "./StrategyGenerationProgress"
import { Button } from "@lumiere/shared/components/ui/button"

interface MessageData {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
  hasStrategy?: boolean
}

interface MessageListProps {
  messages: MessageData[]
  isSending: boolean
  isGeneratingStrategy: boolean
  strategyGenerationProgress: number
  progressStage: string
  progressMessage: string
  error?: { message: string } | null
  generatedStrategy?: any
  onViewStrategy?: () => void
}

export function MessageList({
  messages,
  isSending,
  isGeneratingStrategy,
  strategyGenerationProgress,
  progressStage,
  progressMessage,
  error,
  onViewStrategy
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [thinkingText, setThinkingText] = useState("")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false)

  // Thinking animation
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

  // Track if user is at bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isAtBottom = entry.isIntersecting
        setShowScrollButton(!isAtBottom)

        if (isAtBottom) {
          setUserHasScrolledUp(false)
        } else if (isSending) {
          setUserHasScrolledUp(true)
        }
      },
      { threshold: 0.1 }
    )

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current)
    }

    return () => observer.disconnect()
  }, [isSending])

  // Auto-scroll logic with streaming awareness
  useEffect(() => {
    if (isSending && userHasScrolledUp) {
      return
    }

    if (!showScrollButton || messages.length === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isSending, isGeneratingStrategy, showScrollButton, userHasScrolledUp])

  // Reset userHasScrolledUp when streaming stops
  useEffect(() => {
    if (!isSending) {
      setUserHasScrolledUp(false)
    }
  }, [isSending])

  const scrollToBottom = () => {
    setUserHasScrolledUp(false)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // IMPROVED FILTER: Skip empty messages and streaming messages with no content
  const visibleMessages = messages.filter(msg => {
    const hasContent = msg.content && msg.content.trim().length > 0

    // Always filter out messages with no content
    if (!hasContent) {
      return false
    }

    return true
  })

  const hasStreamingContent = messages.some(m => m.isStreaming && m.content.length > 0)
  const showThinking = isSending && !hasStreamingContent && !isGeneratingStrategy

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto px-6 py-8">
      <div className="space-y-6">
        {visibleMessages.map((message) => (
          <Message
            key={message.id}
            role={message.role}
            content={message.content}
            isStreaming={message.isStreaming}
            hasStrategy={message.hasStrategy}
            onViewStrategy={onViewStrategy}
          />
        ))}

        {isGeneratingStrategy && (
          <StrategyGenerationProgress
            progress={strategyGenerationProgress}
            stage={progressStage}
            message={progressMessage}
          />
        )}

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

      {showScrollButton && (
        <div className="sticky bottom-38 left-0 right-0 flex justify-center pointer-events-none mb-4">
          <Button
            size="icon"
            onClick={scrollToBottom}
            className="h-10 w-10 rounded-full shadow-lg pointer-events-auto"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
