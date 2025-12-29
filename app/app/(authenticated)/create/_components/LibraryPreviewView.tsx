"use client"

import { MessageInput } from "@/components/strategy/MessageInput"
import type { Strategy } from "@/contexts/StrategyContext"

interface LibraryPreviewViewProps {
  strategy: Strategy
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onViewStrategy: () => void
  isHealthy: boolean
  isSending: boolean
}

export function LibraryPreviewView({
  strategy,
  inputValue,
  onInputChange,
  onSend,
  onViewStrategy,
  isHealthy,
  isSending,
}: LibraryPreviewViewProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              {strategy.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {strategy.description}
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={onViewStrategy}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                View Strategy Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="w-full max-w-3xl mx-auto px-6 py-4">
          <MessageInput
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            disabled={!isHealthy || isSending}
            placeholder="Ask Prophet to modify this strategy..."
          />
          {!isHealthy && (
            <p className="text-center text-sm text-destructive mt-2">
              Prophet AI is not responding. Please check the connection.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
