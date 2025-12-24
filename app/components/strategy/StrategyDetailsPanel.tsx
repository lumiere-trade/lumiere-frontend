"use client"

import { useState } from "react"
import { Sliders, Code, Play, MessageSquare, Layers, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"
import { StrategyCodeView } from "./StrategyCodeView"
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

  // Transition state - freeze rendering
  const [isTransitioning, setIsTransitioning] = useState(false)

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
    // Start transition - blur charts
    setIsTransitioning(true)

    if (isParametersFullscreen) {
      collapseParametersFullscreen()
    } else {
      expandParametersFullscreen()
    }

    // Resume after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 320) // 300ms transition + 20ms buffer
  }

  // GPU-optimized: Calculate width in vw units instead of Tailwind classes
  const panelWidthVw = isParametersFullscreen ? 100 : 50

  return (
    <>
      {/* Collapsed state - thin strip on right */}
      <div
        className="fixed right-0 top-0 h-screen w-8 z-10 bg-card border-l border-primary/20"
        style={{
          transform: isOpen ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: isOpen ? 'auto' : 'transform',
        }}
      >
        <div className="h-full flex items-center justify-center" style={{ marginTop: '54px' }}>
          <button
            onClick={onToggle}
            className="h-full w-full px-2 hover:bg-card/80"
            style={{
              transition: 'background-color 150ms ease-in-out',
            }}
            title="Open strategy details"
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Expanded state - GPU-optimized responsive width */}
      <div
        className="fixed right-0 top-[54px] h-[calc(100vh-54px)] bg-background border-l border-border z-10 flex flex-col"
        style={{
          width: `${panelWidthVw}vw`,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: (isOpen || isParametersFullscreen) ? 'transform, width' : 'auto',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          perspective: 1000,
        }}
      >
        {/* Fullscreen mode - Left sidebar with collapsed panels */}
        {isParametersFullscreen && isOpen && (
          <div
            className="absolute left-0 top-0 h-full w-12 bg-card border-r border-primary/20 flex flex-col gap-2 py-4 items-center z-20"
            style={{
              transform: 'translateZ(0)',
            }}
          >
            {/* Strategies Panel Toggle */}
            {onOpenStrategies && (
              <button
                onClick={onOpenStrategies}
                className="p-2 rounded-lg hover:bg-primary/10 group"
                style={{
                  transition: 'background-color 150ms ease-in-out',
                }}
                title="Open strategies"
              >
                <Layers className="h-5 w-5 text-primary" />
              </button>
            )}

            {/* Chat Panel Toggle */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="p-2 rounded-lg hover:bg-primary/10 group"
                style={{
                  transition: 'background-color 150ms ease-in-out',
                }}
                title="Open chat"
              >
                <MessageSquare className="h-5 w-5 text-primary" />
              </button>
            )}
          </div>
        )}

        {/* Half-width mode - 2 buttons stacked */}
        {isOpen && !isParametersFullscreen && (
          <div
            className="absolute top-0 h-full flex items-center justify-center pointer-events-none z-20"
            style={{
              left: '0',
              transform: 'translate(-50%, 0) translateZ(0)',
            }}
          >
            <div className="flex flex-col gap-2 pointer-events-auto">
              {/* Expand to Fullscreen Button */}
              <button
                onClick={handleToggleFullscreen}
                className="h-12 w-7 bg-card border border-primary/20 hover:bg-card/80 rounded-lg shadow-md"
                style={{
                  transition: 'background-color 150ms ease-in-out',
                  transform: 'translateZ(0)',
                }}
                title="Expand to fullscreen"
              >
                <ChevronLeft className="h-4 w-4 text-primary mx-auto" />
              </button>

              {/* Close Button */}
              <button
                onClick={onToggle}
                className="h-12 w-7 bg-card border border-primary/20 hover:bg-card/80 rounded-lg shadow-md"
                style={{
                  transition: 'background-color 150ms ease-in-out',
                  transform: 'translateZ(0)',
                }}
                title="Close sidebar"
              >
                <ChevronRight className="h-4 w-4 text-primary mx-auto" />
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen mode - 1 button only */}
        {isOpen && isParametersFullscreen && (
          <div
            className="absolute top-0 h-full flex items-center justify-center pointer-events-none z-30"
            style={{
              left: 'calc(3rem)',
              transform: 'translate(-50%, 0) translateZ(0)',
            }}
          >
            <button
              onClick={handleToggleFullscreen}
              className="h-12 w-7 bg-card border border-primary/20 hover:bg-card/80 rounded-lg shadow-md pointer-events-auto"
              style={{
                transition: 'background-color 150ms ease-in-out',
                transform: 'translateZ(0)',
              }}
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
                className="gap-2 min-w-[120px]"
              >
                <Sliders className="h-4 w-4" />
                Parameters
              </Button>
              <Button
                variant={activeTab === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTabChange('code')}
                className="gap-2 min-w-[120px]"
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
                className="gap-2 min-w-[120px]"
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
        <div className={`flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] px-6 py-4 relative ${
          isParametersFullscreen ? 'ml-12' : ''
        }`}>
          {/* Blur overlay during transition - ONLY on backtest tab with charts */}
          {isTransitioning && activeTab === 'backtest' && backtestResults && (
            <div 
              className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center"
              style={{
                pointerEvents: 'none',
              }}
            >
              <div className="text-muted-foreground text-sm">Resizing...</div>
            </div>
          )}

          {activeTab === 'parameters' && (
            <StrategyParameters
              hideActions={true}
              compact={true}
            />
          )}

          {activeTab === 'code' && (
            <StrategyCodeView />
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
                  <Button onClick={handleRunBacktest} className="gap-2 min-w-[120px]">
                    <Play className="h-4 w-4" />
                    Run Backtest
                  </Button>
                </div>
              )}
              {!isBacktesting && backtestResults && !isTransitioning && (
                <BacktestResults results={backtestResults} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
