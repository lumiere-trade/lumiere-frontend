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
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed right-6 bottom-32 z-10 cursor-pointer transition-transform duration-200 ease-in-out ${
        show ? 'translate-x-0' : 'translate-x-full'
      }`}
      onClick={onClick}
    >
      <div className="group border border-primary/20 bg-background shadow-xs rounded-full pl-4 pr-5 py-3 transition-all duration-200 flex items-center gap-2.5 hover:bg-primary hover:text-primary-foreground hover:border-primary">
        <MessageSquare className="h-5 w-5 text-foreground group-hover:text-primary-foreground transition-colors" />
        <span className="text-sm font-semibold text-foreground">Chat</span>
      </div>
    </div>
  )
}
