"use client"

import { useState } from "react"
import { MarkdownMessage } from "./MarkdownMessage"
import { Button } from "@lumiere/shared/components/ui/button"
import { Eye, Copy, Check } from "lucide-react"

interface MessageProps {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
  onViewStrategy?: () => void
}

export function Message({ role, content, timestamp, isStreaming, onViewStrategy }: MessageProps) {
  const [copied, setCopied] = useState(false)
  const [showFullDate, setShowFullDate] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Check for strategy marker in content
  const hasStrategyMarker = content.includes('<<view_strategy>>')

  // Filter out the marker from displayed content
  const displayContent = content.replace(/<<view_strategy>>/g, '').trim()

  // Show button if marker is present
  const showViewButton = role === "assistant" && !isStreaming && hasStrategyMarker && onViewStrategy
  const hasContent = displayContent && displayContent.length > 0

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatFullDate = (date: Date) => {
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  // If no content but has strategy button, show ONLY the button (no copy/timestamp)
  if (!hasContent && showViewButton) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="max-w-[80%]">
          <Button
            onClick={onViewStrategy}
            size="lg"
            className="gap-2 text-sm"
          >
            <Eye className="h-5 w-5" />
            View Strategy
          </Button>
        </div>
      </div>
    )
  }

  // If no content and no button, don't show anything
  if (!hasContent) {
    return null
  }

  // Normal message with content
  return (
    <div className={`flex gap-3 ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${role === "user" ? "" : "w-full"}`}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`rounded-2xl px-4 py-3 ${
            role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-primary/20"
          }`}
        >
          {role === "user" ? (
            <p className="text-base leading-relaxed whitespace-pre-line select-text">
              {displayContent}
            </p>
          ) : (
            <MarkdownMessage content={displayContent} />
          )}
        </div>

        {/* Timestamp (hover only - LEFT) + Copy button (hover only - RIGHT) */}
        {!isStreaming && isHovered && (
          <div
            className={`flex items-center justify-between gap-2 mt-1 px-2 ${role === "user" ? "flex-row-reverse" : "flex-row"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Timestamp - ВЛЯВО, само при hover */}
            <div
              className="relative"
              onMouseEnter={() => setShowFullDate(true)}
              onMouseLeave={() => setShowFullDate(false)}
            >
              <span className="text-sm text-muted-foreground cursor-default">
                {formatTime(timestamp)}
              </span>
              {showFullDate && (
                <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-popover border border-border rounded-md shadow-lg whitespace-nowrap z-50">
                  <span className="text-sm text-foreground">
                    {formatFullDate(timestamp)}
                  </span>
                </div>
              )}
            </div>

            {/* Copy button - ВДЯСНО, само при hover */}
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-muted/50 transition-colors cursor-pointer"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        )}

        {/* View Strategy бутон - отделен, БЕЗ copy/timestamp под него */}
        {showViewButton && (
          <div className="mt-3">
            <Button
              onClick={onViewStrategy}
              size="lg"
              className="gap-2 text-sm"
            >
              <Eye className="h-5 w-5" />
              View Strategy
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
