"use client"

import { X } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"

interface StrategyDetailsPanelProps {
  activeTab: 'parameters' | 'code' | 'backtest'
  onTabChange: (tab: 'parameters' | 'code' | 'backtest') => void
  strategy: any
  onClose: () => void
}

export function StrategyDetailsPanel({
  activeTab,
  onTabChange,
  strategy,
  onClose
}: StrategyDetailsPanelProps) {
  const tabs = [
    { id: 'parameters' as const, label: 'Parameters' },
    { id: 'code' as const, label: 'Code' },
    { id: 'backtest' as const, label: 'Backtest' }
  ]

  // Transform generatedStrategy to StrategyParameters format
  const strategyForParams = strategy ? {
    name: strategy.name,
    type: 'AI Generated',
    parameters: strategy.metadata || {},
    tsdl_code: strategy.tsdl_code
  } : null

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="h-16 border-b border-border px-8 flex items-center justify-between bg-card/50 flex-shrink-0">
        <h2 className="text-lg font-semibold">Strategy Details</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card/30 flex-shrink-0">
        <div className="flex px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'parameters' && strategyForParams && (
          <StrategyParameters strategy={strategyForParams} />
        )}
        {activeTab === 'code' && strategy && (
          <div className="bg-card border border-border rounded-lg p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {strategy.tsdl_code}
            </pre>
          </div>
        )}
        {activeTab === 'backtest' && (
          <div className="text-center text-muted-foreground">
            Backtest functionality coming soon
          </div>
        )}
      </div>
    </div>
  )
}
