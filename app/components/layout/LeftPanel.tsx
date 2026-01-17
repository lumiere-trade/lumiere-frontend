"use client"

/**
 * LeftPanel - Sidebar + Chat container (50% of screen)
 * Sidebar: Has its own width management (collapsed/expanded)
 * Chat: Takes remaining space (flex-1)
 */

import { ReactNode } from 'react'
import { StrategyPanel } from '@/components/strategy/StrategyPanel'
import { useState } from 'react'

interface LeftPanelProps {
  children: ReactNode
}

export function LeftPanel({ children }: LeftPanelProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="w-1/2 h-full flex bg-background border-r border-border">
      {/* Strategy Sidebar - Manages its own width */}
      <StrategyPanel 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Chat Panel - Takes remaining space */}
      <div className="flex-1 h-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}
