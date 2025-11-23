"use client"

import { MessageSquare } from "lucide-react"

interface ChatTeaserProps {
  onClick: () => void
}

export function ChatTeaser({ onClick }: ChatTeaserProps) {
  return (
    <div
      className="fixed right-6 bottom-32 z-[70] cursor-pointer animate-in slide-in-from-right-5 duration-500"
      onClick={onClick}
    >
      <div className="bg-card border border-primary/30 rounded-full pl-4 pr-5 py-3 shadow-[0_4px_12px_rgb(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgb(0,0,0,0.2)] transition-all duration-200 flex items-center gap-2.5 hover:scale-105 hover:-translate-y-0.5 group">
        <MessageSquare className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Chat</span>
      </div>
    </div>
  )
}
