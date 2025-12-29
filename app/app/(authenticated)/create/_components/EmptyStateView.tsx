"use client"

import { MessageInput } from "@/components/strategy/MessageInput"
import { ExamplePrompts } from "@/components/strategy/ExamplePrompts"

interface EmptyStateViewProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  isHealthy: boolean
  isSending: boolean
  examplePrompts: string[]
}

export function EmptyStateView({
  inputValue,
  onInputChange,
  onSend,
  isHealthy,
  isSending,
  examplePrompts,
}: EmptyStateViewProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Ready to create your strategy?
          </h1>
        </div>

        <MessageInput
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={!isHealthy || isSending}
          placeholder="Describe your trading strategy..."
        />

        <ExamplePrompts
          prompts={examplePrompts}
          onSelect={onInputChange}
          disabled={isSending}
        />

        {!isHealthy && (
          <div className="text-center">
            <p className="text-sm text-destructive">
              Prophet AI is not responding. Please check the connection.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
