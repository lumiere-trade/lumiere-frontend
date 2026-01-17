"use client"

/**
 * RightPanel - Strategy Details Panel (50% of screen)
 * Always visible on /create page with strategy loaded
 */

import { StrategyDetailsPanel } from '@/components/strategy/StrategyDetailsPanel'
import { useStrategy } from '@/contexts/StrategyContext'

export function RightPanel() {
  const { detailsPanelTab, setDetailsPanelTab } = useStrategy()

  return (
    <div className="w-1/2 h-full bg-background overflow-hidden">
      <StrategyDetailsPanel
        activeTab={detailsPanelTab}
        onTabChange={setDetailsPanelTab}
      />
    </div>
  )
}
