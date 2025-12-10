"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { Message } from "./Message"
import { StrategyGenerationProgress } from "./StrategyGenerationProgress"

interface MessageData {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

interface MessageListProps {
  messages: MessageData[]
  isSending: boolean
  isGeneratingStrategy: boolean
  strategyGenerationProgress: number
  progressStage: string
  progressMessage: string
  error?: { message: string } | null
}

export function MessageList({
  messages,
  isSending,
  isGeneratingStrategy,
  strategyGenerationProgress,
  progressStage,
  progressMessage,
  error
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [thinkingText, setThinkingText] = useState("")

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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending, isGeneratingStrategy])

  const visibleMessages = messages.filter(msg => msg.content.trim().length > 0)
  const hasStreamingContent = messages.some(m => m.isStreaming && m.content.length > 0)
  const showThinking = isSending && !hasStreamingContent && !isGeneratingStrategy

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8 space-y-6">
      {visibleMessages.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          content={message.content}
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
  )
}
