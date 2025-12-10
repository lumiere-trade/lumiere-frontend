"use client"

import { PanelLeftClose } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiere/shared/components/ui/tabs'
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
  // Transform generatedStrategy to StrategyParameters format
  const strategyForParams = strategy ? {
    name: strategy.name,
    type: 'AI Generated',
    parameters: strategy.metadata || {},
    tsdl_code: strategy.tsdl_code
  } : null

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as any)} className="h-full flex flex-col">
        {/* Tabs header with close button */}
        <div className="border-b border-border flex-shrink-0 px-8 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1">
              <TabsTrigger value="parameters" className="text-base">Parameters</TabsTrigger>
              <TabsTrigger value="code" className="text-base">Code</TabsTrigger>
              <TabsTrigger value="backtest" className="text-base">Backtest</TabsTrigger>
            </TabsList>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 flex-shrink-0"
            >
              <PanelLeftClose className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <TabsContent value="parameters" className="mt-0">
            {strategyForParams && (
              <StrategyParameters strategy={strategyForParams} />
            )}
          </TabsContent>

          <TabsContent value="code" className="mt-0">
            {strategy && (
              <div className="bg-card border border-border rounded-lg p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {strategy.tsdl_code}
                </pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="backtest" className="mt-0">
            <div className="text-center text-muted-foreground py-12">
              Backtest functionality coming soon
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
