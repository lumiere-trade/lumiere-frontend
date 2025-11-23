"use client"

import { MessageSquare } from "lucide-react"

interface ChatTeaserProps {
  onClick: () => void
  show: boolean
}

export function ChatTeaser({ onClick, show }: ChatTeaserProps) {
  // Remove delayed unmount - keep in DOM always for smooth animations
  if (!show) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className={`
        fixed right-6 bottom-32 z-[70]
        transition-all duration-300 ease-out
        ${show ? 'translate-x-0 opacity-100' : 'translate-x-[200%] opacity-0'}
      `}
      style={{
        willChange: 'transform, opacity',
      }}
      aria-label="Open chat"
    >
      <div className="group bg-card border border-primary/30 rounded-full pl-4 pr-5 py-3 shadow-[0_4px_12px_rgb(0,0,0,0.15)] transition-all duration-200 flex items-center gap-2.5 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-[0_6px_20px_rgb(0,0,0,0.2)]">
        <MessageSquare className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
        <span className="text-sm font-semibold">Chat</span>
      </div>
    </button>
  )
}
