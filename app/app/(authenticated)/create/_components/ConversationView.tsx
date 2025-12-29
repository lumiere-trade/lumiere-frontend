"use client"

import { MessageInput } from "@/components/strategy/MessageInput"
import { MessageList } from "@/components/strategy/MessageList"
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
  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto pb-4">
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

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="w-full max-w-3xl mx-auto px-6 py-4">
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
        </div>
      </div>
    </div>
  )
}
