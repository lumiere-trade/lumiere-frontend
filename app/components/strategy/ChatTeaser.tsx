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
      <div className="group bg-card border border-primary/30 rounded-full pl-4 pr-5 py-3 shadow-[0_4px_12px_rgb(0,0,0,0.15)] transition-all duration-200 flex items-center gap-2.5 hover:bg-primary hover:text-primary-foreground hover:border-primary">
        <MessageSquare className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
        <span className="text-sm font-semibold">Chat</span>
      </div>
    </div>
  )
}
