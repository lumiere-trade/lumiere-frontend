"use client"

import { PanelRightClose, Sliders, Code, Play, Save } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"
import { useState } from "react"

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
  const [isSaving, setIsSaving] = useState(false)

  // Transform generatedStrategy to StrategyParameters format
  const strategyForParams = strategy ? {
    name: strategy.name,
    type: 'AI Generated',
    parameters: strategy.metadata || {},
    tsdl_code: strategy.tsdl_code
  } : null

  const handleSaveStrategy = async () => {
    // TODO: Trigger save from StrategyParameters
    console.log('Save strategy clicked')
  }

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header with action buttons */}
      <div className="border-b border-border flex-shrink-0 px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTab === 'parameters' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTabChange('parameters')}
              className="gap-2"
            >
              <Sliders className="h-4 w-4" />
              Parameters
            </Button>
            <Button
              variant={activeTab === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTabChange('code')}
              className="gap-2"
            >
              <Code className="h-4 w-4" />
              View Code
            </Button>
            <Button
              variant={activeTab === 'backtest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTabChange('backtest')}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Backtest
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveStrategy}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Strategy
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'parameters' && strategyForParams && (
          <StrategyParameters 
            strategy={strategyForParams}
            hideActions={true}
          />
        )}
        {activeTab === 'code' && strategy && (
          <div className="bg-card border border-border rounded-lg p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {strategy.tsdl_code}
            </pre>
          </div>
        )}
        {activeTab === 'backtest' && (
          <div className="text-center text-muted-foreground py-12">
            Backtest functionality coming soon
          </div>
        )}
      </div>
    </div>
  )
}
