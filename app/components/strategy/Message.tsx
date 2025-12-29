"use client"

import { MarkdownMessage } from "./MarkdownMessage"
import { Button } from "@lumiere/shared/components/ui/button"
import { Eye } from "lucide-react"

interface MessageProps {
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
  onViewStrategy?: () => void
}

export function Message({ role, content, isStreaming, onViewStrategy }: MessageProps) {
  // Check for strategy marker in content
  const hasStrategyMarker = content.includes('<<view_strategy>>')

  // Filter out the marker from displayed content
  const displayContent = content.replace(/<<view_strategy>>/g, '').trim()

  // Show button if marker is present
  const showViewButton = role === "assistant" && !isStreaming && hasStrategyMarker && onViewStrategy
  const hasContent = displayContent && displayContent.length > 0

  // If no content but has strategy button, show ONLY the button
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
