"use client"

import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"

interface ChatTeaserProps {
  onClick: () => void
  show: boolean
}

export function ChatTeaser({ onClick, show }: ChatTeaserProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed right-6 bottom-32 z-10 cursor-pointer transition-transform duration-300 ease-in-out ${
        show ? 'translate-x-0' : 'translate-x-full'
      }`}
      onClick={onClick}
    >
      <div className="group bg-card border border-primary/30 rounded-full pl-4 pr-5 py-3 shadow-[0_4px_12px_rgb(0,0,0,0.15)] transition-all duration-200 flex items-center gap-2.5 hover:bg-primary hover:text-primary-foreground hover:border-primary">
        <MessageSquare className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
        <span className="text-sm font-semibold">Chat</span>
      </div>
    </div>
  )
}
