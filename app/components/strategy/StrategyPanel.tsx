"use client"

import { useState } from "react"
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Plus, 
  Layers,
  ChevronDown,
  ChevronRight
} from "lucide-react"

interface StrategyPanelProps {
  isOpen: boolean
  onToggle: () => void
}

const mockStrategies = [
  { id: 1, name: "SOL Momentum", status: "Active", winRate: "67.3%" },
  { id: 2, name: "RSI Reversion", status: "Backtesting", winRate: "72.1%" },
]

export function StrategyPanel({ isOpen, onToggle }: StrategyPanelProps) {
  const [strategiesExpanded, setStrategiesExpanded] = useState(true)

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-[73px] h-[calc(100vh-73px)] z-40">
        <button
          onClick={onToggle}
          className="h-full px-2 bg-card border-r border-primary/20 hover:bg-card/80 transition-colors"
          title="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5 text-primary" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed left-0 top-[73px] h-[calc(100vh-73px)] w-[300px] bg-background border-r border-primary/20 z-40 flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
        <h2 className="text-sm font-bold text-primary">CREATE</h2>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-primary/10 transition-colors"
          title="Close sidebar"
        >
          <PanelLeftClose className="h-5 w-5 text-primary" />
        </button>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* New Strategy Section */}
        <div className="border-b border-primary/20">
          <button
            className="w-full flex items-center gap-2 px-4 py-4 hover:bg-card/30 transition-colors"
          >
            <Plus className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              New Strategy
            </span>
          </button>
        </div>

        {/* Strategies Section */}
        <div className="border-b border-primary/20">
          <button
            onClick={() => setStrategiesExpanded(!strategiesExpanded)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-card/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Strategies
              </h3>
            </div>
            {strategiesExpanded ? (
              <ChevronDown className="h-4 w-4 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-primary" />
            )}
          </button>

          {strategiesExpanded && (
            <div className="px-4 pb-4 space-y-2">
              {mockStrategies.map((strategy) => (
                <button
                  key={strategy.id}
                  className="w-full text-left p-3 rounded-lg border border-primary/20 bg-card hover:border-primary/40 transition-colors"
                >
                  <div className="text-sm font-medium text-foreground truncate">
                    {strategy.name}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {strategy.status}
                    </span>
                    <span className="text-xs text-green-500">
                      {strategy.winRate}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
