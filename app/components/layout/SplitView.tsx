"use client"

/**
 * SplitView - Fixed 50/50 split layout for /create page
 * Left: StrategyPanel (sidebar) + Chat (50%)
 * Right: StrategyDetailsPanel (50%)
 */

import { ReactNode } from 'react'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'

interface SplitViewProps {
  children: ReactNode
}

export function SplitView({ children }: SplitViewProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Sidebar + Chat (50%) */}
      <LeftPanel>
        {children}
      </LeftPanel>

      {/* Right Panel - Strategy Details (50%) */}
      <RightPanel />
    </div>
  )
}
