"use client"

import { MarkdownMessage } from "./MarkdownMessage"

interface MessageProps {
  role: "user" | "assistant"
  content: string
}

export function Message({ role, content }: MessageProps) {
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
      </div>
    </div>
  )
}
