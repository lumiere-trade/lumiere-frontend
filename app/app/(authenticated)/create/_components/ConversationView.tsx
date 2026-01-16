"use client"

import { MessageInput } from "@/components/strategy/MessageInput"
import { MessageList } from "@/components/strategy/MessageList"
import { StrategyInfoBanner } from "./StrategyInfoBanner"
import type { ChatMessage, Strategy } from "@/contexts/StrategyContext"

interface ConversationViewProps {
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isSending: boolean
  isHealthy: boolean
  isGeneratingStrategy: boolean
  strategyGenerationProgress: number
  progressStage: string
  progressMessage: string
  error: Error | null
  generatedStrategy: Strategy | null
  onViewStrategy: () => void
}

export function ConversationView({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onStop,
  isSending,
  isHealthy,
  isGeneratingStrategy,
  strategyGenerationProgress,
  progressStage,
  progressMessage,
  error,
  generatedStrategy,
  onViewStrategy,
}: ConversationViewProps) {
  // Show banner only when there are no messages and no active conversation
  const showBanner = messages.length === 0 && !isSending && generatedStrategy

  return (
    <div className="relative h-[calc(100vh-80px)]">
      {/* Show banner OR chat messages, never both */}
      {showBanner ? (
        /* Strategy Info Banner - centered, no scroll */
        <StrategyInfoBanner
          strategy={generatedStrategy}
          onViewDetails={onViewStrategy}
        />
      ) : (
        /* Chat Messages - full height scroll */
        <div className="h-full overflow-y-auto">
          <MessageList
            messages={messages}
            isSending={isSending}
            isGeneratingStrategy={isGeneratingStrategy}
            strategyGenerationProgress={strategyGenerationProgress}
            progressStage={progressStage}
            progressMessage={progressMessage}
            error={error}
            generatedStrategy={generatedStrategy}
            onViewStrategy={onViewStrategy}
          />
        </div>
      )}

      {/* Absolute positioned input - always at bottom */}
      <div className="absolute bottom-0 left-0 right-4 bg-background/95 backdrop-blur-sm pointer-events-none">
        <div className="w-full max-w-3xl mx-auto px-6 py-4 pointer-events-auto">
          <MessageInput
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            onStop={onStop}
            disabled={!isHealthy}
            isSending={isSending}
            placeholder="Reply..."
            autoFocus={true}
          />
          <div className="flex justify-center pt-2">
            <p className="text-sm text-muted-foreground text-center">
              Lumiere is AI and can make mistakes. Use for educational purposes and not as trading advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
