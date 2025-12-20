"use client"

import { Sliders, Code, Play, MessageSquare, Layers, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"
import { BacktestResults } from "./BacktestResults"
import { useRunBacktest } from "@/hooks/mutations/use-cartographe-mutations"
import { useChat } from "@/contexts/ChatContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

interface StrategyDetailsPanelProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: 'parameters' | 'code' | 'backtest'
  onTabChange: (tab: 'parameters' | 'code' | 'backtest') => void
  onOpenStrategies?: () => void
  onOpenChat?: () => void
}

export function StrategyDetailsPanel({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  onOpenStrategies,
  onOpenChat
}: StrategyDetailsPanelProps) {
  const log = useLogger('StrategyDetailsPanel', LogCategory.COMPONENT)
  const {
    generatedStrategy,
    strategyMetadata,
    backtestResults,
    isBacktesting,
    setBacktestResults,
    setIsBacktesting,
    isParametersFullscreen,
    expandParametersFullscreen,
    collapseParametersFullscreen
  } = useChat()
  const runBacktestMutation = useRunBacktest()

  const handleRunBacktest = async () => {
    if (!generatedStrategy || !strategyMetadata) {
      log.error('No strategy to backtest')
      return
    }

    setIsBacktesting(true)
    setBacktestResults(null)

    try {
      const result = await runBacktestMutation.mutateAsync({
        strategy_json: strategyMetadata,
        candles: 2160,
        initial_capital: 10000,
        cache_results: true
      })

      setBacktestResults(result)
    } catch (error) {
      log.error('Backtest failed', { error })
    } finally {
      setIsBacktesting(false)
    }
  }

  const handleToggleFullscreen = () => {
    if (isParametersFullscreen) {
      collapseParametersFullscreen()
    } else {
      expandParametersFullscreen()
    }
  }

  const panelWidth = isParametersFullscreen ? 'w-full' : 'w-1/2'

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
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Expanded state - responsive width */}
      <div
        className={`fixed right-0 top-[54px] h-[calc(100vh-54px)] ${panelWidth} bg-background border-l border-border z-10 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Fullscreen mode - Left sidebar with collapsed panels */}
        {isParametersFullscreen && isOpen && (
          <div className="absolute left-0 top-0 h-full w-12 bg-card border-r border-primary/20 flex flex-col gap-2 py-4 items-center z-20">
            {/* Strategies Panel Toggle */}
            {onOpenStrategies && (
              <button
                onClick={onOpenStrategies}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                title="Open strategies"
              >
                <Layers className="h-5 w-5 text-primary" />
              </button>
            )}

            {/* Chat Panel Toggle */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                title="Open chat"
              >
                <MessageSquare className="h-5 w-5 text-primary" />
              </button>
            )}
          </div>
        )}

        {/* Half-width mode - 2 buttons stacked */}
        {isOpen && !isParametersFullscreen && (
          <div className="absolute top-0 h-full flex items-center justify-center pointer-events-none" style={{ left: '-16px' }}>
            <div className="flex flex-col gap-2 pointer-events-auto">
              {/* Expand to Fullscreen Button */}
              <button
                onClick={handleToggleFullscreen}
                className="h-12 w-7 bg-card border border-primary/20 hover:bg-card/80 transition-colors rounded-lg shadow-md"
                title="Expand to fullscreen"
              >
                <ChevronLeft className="h-4 w-4 text-primary mx-auto" />
              </button>

              {/* Close Button */}
              <button
                onClick={onToggle}
                className="h-12 w-7 bg-card border border-primary/20 hover:bg-card/80 transition-colors rounded-lg shadow-md"
                title="Close sidebar"
              >
                <ChevronRight className="h-4 w-4 text-primary mx-auto" />
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen mode - 1 button only */}
        {isOpen && isParametersFullscreen && (
          <div className="absolute top-0 h-full flex items-center justify-center pointer-events-none" style={{ left: '-16px' }}>
            <button
              onClick={handleToggleFullscreen}
              className="h-12 w-7 bg-card border border-primary/20 hover:bg-card/80 transition-colors rounded-lg shadow-md pointer-events-auto"
              title="Collapse to half"
            >
              <ChevronRight className="h-4 w-4 text-primary mx-auto" />
            </button>
          </div>
        )}

        {/* Header with tab navigation */}
        <div className={`border-b border-border flex-shrink-0 px-4 md:px-6 py-3 md:py-4 flex items-center justify-center ${
          isParametersFullscreen ? 'ml-12' : ''
        }`}>
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
                  <Play className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Backtest
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 ${
          isParametersFullscreen ? 'ml-12' : ''
        }`}>
          {activeTab === 'parameters' && (
            <StrategyParameters
              hideActions={true}
              compact={true}
            />
          )}

          {activeTab === 'code' && generatedStrategy && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Generated Python Code</h3>
                <p className="text-sm text-muted-foreground">Class: <span className="font-mono">{generatedStrategy.strategy_class_name}</span></p>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {generatedStrategy.python_code}
              </pre>
            </div>
          )}

          {activeTab === 'backtest' && (
            <div>
              {isBacktesting && (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
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
