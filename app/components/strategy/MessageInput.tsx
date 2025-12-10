"use client"

import { KeyboardEvent } from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  disabled?: boolean
  isSending?: boolean
  placeholder?: string
  className?: string
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onStop,
  disabled = false,
  isSending = false,
  placeholder = "Describe your trading strategy...",
  className = ""
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isSending && onStop) {
        onStop()
      } else {
        onSend()
      }
    }
  }

  const handleButtonClick = () => {
    if (isSending && onStop) {
      onStop()
    } else {
      onSend()
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        disabled={disabled}
        className="w-full px-6 py-4 pr-16 rounded-2xl border border-primary/20 bg-card/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <Button
        size="icon"
        onClick={handleButtonClick}
        disabled={disabled || (!isSending && !value.trim())}
        className="absolute right-3 bottom-3 h-10 w-10 rounded-xl"
        variant={isSending ? "destructive" : "default"}
      >
        {isSending ? (
          <Square className="h-4 w-4" fill="currentColor" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}
