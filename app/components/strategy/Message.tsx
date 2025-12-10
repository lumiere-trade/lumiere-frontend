"use client"

import { Sparkles } from "lucide-react"
import { MarkdownMessage } from "./MarkdownMessage"

interface MessageProps {
  role: "user" | "assistant"
  content: string
}

export function Message({ role, content }: MessageProps) {
  return (
    <div className={`flex gap-3 ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "assistant" && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0 self-start mt-1">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}

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
      </div>
    </div>
  )
}
