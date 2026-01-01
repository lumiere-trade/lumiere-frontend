"use client"

import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Circle } from "lucide-react"
import { useStrategy } from "@/contexts/StrategyContext"

interface StrategyConditionsVisualizerProps {
  mode: 'entry' | 'exit' | 'both'
}

export function StrategyConditionsVisualizer({ mode = 'both' }: StrategyConditionsVisualizerProps) {
  const { editedStrategy } = useStrategy()

  if (!editedStrategy) return null

  const parseCondition = (condition: string) => {
    const crossesAbove = condition.includes('crosses_above')
    const crossesBelow = condition.includes('crosses_below')
    const greaterThan = condition.includes('>')
    const lessThan = condition.includes('<')
    
    return {
      text: condition,
      crossesAbove,
      crossesBelow,
      greaterThan,
      lessThan,
      icon: crossesAbove ? ArrowUp : crossesBelow ? ArrowDown : greaterThan ? TrendingUp : lessThan ? TrendingDown : Circle
    }
  }

  const entryConditions = editedStrategy.entry_rules?.map(parseCondition) || []
  const exitConditions = editedStrategy.exit_rules?.map(parseCondition) || []

  const showEntry = mode === 'entry' || mode === 'both'
  const showExit = mode === 'exit' || mode === 'both'

  return (
    <div className="space-y-6">
      {/* Entry Visualization */}
      {showEntry && (
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Entry Conditions</h3>
              <p className="text-sm text-muted-foreground">
                All conditions must align for entry signal
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {entryConditions.map((condition, idx) => {
              const Icon = condition.icon
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md bg-green-500/20 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-mono font-semibold text-green-600">{idx}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <code className="text-sm font-mono text-foreground">{condition.text}</code>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Entry Logic */}
          <div className="mt-4 p-3 bg-background/50 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Logic:</span>
              <code className="text-sm font-mono text-green-600">{editedStrategy.entry_logic}</code>
            </div>
          </div>
        </div>
      )}

      {/* Exit Visualization */}
      {showExit && (
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Exit Conditions</h3>
              <p className="text-sm text-muted-foreground">
                Any condition triggers exit signal
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {exitConditions.map((condition, idx) => {
              const Icon = condition.icon
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md bg-red-500/20 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-mono font-semibold text-red-600">{idx}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <code className="text-sm font-mono text-foreground">{condition.text}</code>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Exit Logic */}
          <div className="mt-4 p-3 bg-background/50 rounded-lg border border-red-500/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Logic:</span>
              <code className="text-sm font-mono text-red-600">{editedStrategy.exit_logic}</code>
            </div>
          </div>
        </div>
      )}

      {/* Indicators Legend */}
      <div className="bg-muted/30 border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Indicators</h3>
        <div className="flex flex-wrap gap-2">
          {editedStrategy.indicators?.map((indicator, idx) => (
            <div key={idx} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm font-mono text-foreground">
              {indicator}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
