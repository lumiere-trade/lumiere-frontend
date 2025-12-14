"use client"

import { MarkdownMessage } from "./MarkdownMessage"
import { Button } from "@lumiere/shared/components/ui/button"
import { Eye } from "lucide-react"

interface MessageProps {
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
  hasStrategy?: boolean
  onViewStrategy?: () => void
}

export function Message({ role, content, isStreaming, hasStrategy, onViewStrategy }: MessageProps) {
  const showViewButton = role === "assistant" && !isStreaming && hasStrategy && onViewStrategy

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
            <p className="text-base leading-relaxed whitespace-pre-line">
              {content}
            </p>
          ) : (
            <MarkdownMessage content={content} />
          )}
        </div>

        {showViewButton && (
          <div className="mt-3">
            <Button
              onClick={onViewStrategy}
              size="lg"
              className="gap-2"
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
