"use client"

import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"

interface ChatTeaserProps {
  onClick: () => void
  show: boolean
}

export function ChatTeaser({ onClick, show }: ChatTeaserProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (show) {
      // Show: render then animate in
      setShouldRender(true)
      // Double requestAnimationFrame for reliable animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
    } else {
      // Hide: animate out then remove
      setIsVisible(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed right-6 bottom-32 z-[70] cursor-pointer transition-transform duration-300 will-change-transform ${
        isVisible
          ? 'translate-x-0'
          : 'translate-x-full'
      }`}
      onClick={onClick}
      style={{ transform: 'translateZ(0)' }}
    >
      <div className="group bg-card border border-primary/30 rounded-full pl-4 pr-5 py-3 shadow-[0_4px_12px_rgb(0,0,0,0.15)] transition-all duration-200 flex items-center gap-2.5 hover:bg-primary hover:text-primary-foreground hover:border-primary">
        <MessageSquare className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
        <span className="text-sm font-semibold">Chat</span>
      </div>
    </div>
  )
}
