"use client"

import { KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Describe your trading strategy...",
  className = ""
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
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
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="absolute right-3 bottom-3 h-10 w-10 rounded-xl"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  )
}
