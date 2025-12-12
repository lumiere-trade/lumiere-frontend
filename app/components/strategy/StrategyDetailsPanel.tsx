"use client"

import { PanelRightOpen, PanelRightClose, Sliders, Code, Play, Save, Loader2 } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"
import { BacktestResults } from "./BacktestResults"
import { useState } from "react"
import { useRunBacktest } from "@/hooks/mutations/use-cartographe-mutations"
import { useChat } from "@/contexts/ChatContext"

interface StrategyDetailsPanelProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: 'parameters' | 'code' | 'backtest'
  onTabChange: (tab: 'parameters' | 'code' | 'backtest') => void
  strategy: any
}

export function StrategyDetailsPanel({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  strategy
}: StrategyDetailsPanelProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { backtestResults, isBacktesting, setBacktestResults, setIsBacktesting } = useChat()
  const runBacktestMutation = useRunBacktest()

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

  const handleRunBacktest = async () => {
    if (!strategy || !strategy.tsdl_code) {
      console.error('No strategy to backtest')
      return
    }

    setIsBacktesting(true)
    setBacktestResults(null)

    try {
      const result = await runBacktestMutation.mutateAsync({
        tsdl_document: strategy.tsdl_code,
        symbol: 'SOL/USDC',
        days_back: 90,
        initial_capital: 10000,
        timeframe: '1h',
        slippage: 0.001,
        commission: 0.001,
        cache_results: true
      })

      setBacktestResults(result)
    } catch (error) {
      console.error('Backtest failed:', error)
    } finally {
      setIsBacktesting(false)
    }
  }

  return (
    <>
      {/* Collapsed state - thin strip on right */}
      <div
        className={`fixed right-0 top-0 h-screen w-8 z-10 bg-card border-l border-primary/20 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="h-full flex items-center justify-center" style={{ marginTop: '54px' }}>
          <button
            onClick={onToggle}
            className="h-full w-full px-2 hover:bg-card/80 transition-colors"
            title="Open strategy details"
          >
            <PanelRightOpen className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Expanded state - full panel */}
      <div
        className={`fixed right-0 top-[54px] h-[calc(100vh-54px)] w-1/2 bg-background border-l border-border z-10 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button - centered on left edge border - only visible when panel is open */}
        {isOpen && (
          <div className="absolute top-0 h-full flex items-center justify-center pointer-events-none" style={{ left: '-16px' }}>
            <button
              onClick={onToggle}
              className="h-16 w-8 bg-card border border-primary/20 hover:bg-card/80 transition-colors rounded-lg pointer-events-auto shadow-md"
              title="Close sidebar"
            >
              <PanelRightClose className="h-5 w-5 text-primary mx-auto" />
            </button>
          </div>
        )}

        {/* Header with action buttons */}
        <div className="border-b border-border flex-shrink-0 px-6 py-6 flex items-center min-h-[88px]">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2">
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
                onClick={() => {
                  onTabChange('backtest')
                  if (!backtestResults && !isBacktesting) {
                    handleRunBacktest()
                  }
                }}
                className="gap-2"
                disabled={isBacktesting}
              >
                {isBacktesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
          {activeTab === 'parameters' && strategyForParams && (
            <StrategyParameters
              strategy={strategyForParams}
              hideActions={true}
              compact={true}
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
            <div>
              {isBacktesting && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-lg font-semibold">Running backtest...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take up to 60 seconds
                  </p>
                </div>
              )}
              {!isBacktesting && !backtestResults && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No backtest results yet</p>
                  <Button onClick={handleRunBacktest} className="gap-2">
                    <Play className="h-4 w-4" />
                    Run Backtest
                  </Button>
                </div>
              )}
              {!isBacktesting && backtestResults && (
                <BacktestResults results={backtestResults} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
