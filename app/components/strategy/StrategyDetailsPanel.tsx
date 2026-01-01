"use client"

import { useState } from "react"
import { BookOpen, Sliders, Code, Play, MessageSquare, Layers, ChevronRight, ChevronLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"
import { StrategyCodeView } from "./StrategyCodeView"
import { BacktestResults } from "./BacktestResults"
import { LibraryEducationalContent } from "./LibraryEducationalContent"
import { useRunBacktest } from "@/hooks/mutations/use-cartographe-mutations"
import {
  useCreateStrategy,
  useUpdateStrategy,
  useCreateConversation
} from "@/hooks/mutations/use-architect-mutations"
import { useStrategy } from "@/contexts/StrategyContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { toast } from "sonner"

interface StrategyDetailsPanelProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: 'library' | 'parameters' | 'code' | 'backtest'
  onTabChange: (tab: 'library' | 'parameters' | 'code' | 'backtest') => void
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
    strategy,
    editedStrategy,
    editedName,
    updateStrategy,
    updateEditedStrategy,
    backtestResults,
    isBacktesting,
    setBacktestResults,
    setIsBacktesting,
    educationalContent,
    isParametersFullscreen,
    expandParametersFullscreen,
    collapseParametersFullscreen,
    isDirty
  } = useStrategy()

  const runBacktestMutation = useRunBacktest()
  const createStrategyMutation = useCreateStrategy()
  const updateStrategyMutation = useUpdateStrategy()
  const createConversationMutation = useCreateConversation()

  // Transition state - freeze chart rendering
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleRunBacktest = async () => {
    if (!editedStrategy) {
      log.error('No strategy to backtest')
      return
    }

    setIsBacktesting(true)
    setBacktestResults(null)

    try {
      const result = await runBacktestMutation.mutateAsync({
        strategy_json: editedStrategy,
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

  const handleSave = async () => {
    if (!strategy || !editedStrategy) return

    try {
      const isEditing = !!strategy.id

      log.info(isEditing ? 'Updating strategy' : 'Creating new strategy', {
        strategyId: strategy.id,
        name: editedName
      })

      // Sync editedName with editedStrategy.name before saving
      updateEditedStrategy({ name: editedName })

      // FIRST: Update strategy in Context immediately
      // This makes strategy.tsdl = editedStrategy, so isDirty becomes false
      updateStrategy({
        name: editedName,
        description: editedStrategy.description,
        tsdl: { ...editedStrategy, name: editedName }
      })

      let strategyId: string

      // SECOND: Save to backend
      if (isEditing) {
        await updateStrategyMutation.mutateAsync({
          strategyId: strategy.id,
          updates: {
            name: editedName,
            description: editedStrategy.description,
            tsdl_code: JSON.stringify({ ...editedStrategy, name: editedName }, null, 2),
            base_plugins: strategy.basePlugins,
            parameters: { ...editedStrategy, name: editedName }
          }
        })
        strategyId = strategy.id
      } else {
        const strategyResponse = await createStrategyMutation.mutateAsync({
          name: editedName,
          description: editedStrategy.description,
          tsdl_code: JSON.stringify({ ...editedStrategy, name: editedName }, null, 2),
          version: strategy.version,
          base_plugins: strategy.basePlugins,
          parameters: { ...editedStrategy, name: editedName }
        })
        strategyId = strategyResponse.strategy_id

        // Update with new ID from backend
        updateStrategy({ id: strategyId })
      }

      if (strategy.conversation.messages.length > 0) {
        await createConversationMutation.mutateAsync({
          strategy_id: strategyId,
          messages: strategy.conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          }))
        })
      }

      toast.success(isEditing ? 'Strategy updated' : 'Strategy created')
    } catch (error) {
      log.error('Failed to save strategy', { error })
      toast.error('Failed to save strategy')
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

  const isSaving = createStrategyMutation.isPending ||
                   updateStrategyMutation.isPending ||
                   createConversationMutation.isPending

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
            className="h-full w-full px-2 hover:bg-card"
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
                className="h-12 w-7 bg-card border border-primary/20 hover:bg-card rounded-lg shadow-md"
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
                className="h-12 w-7 bg-card border border-primary/20 hover:bg-card rounded-lg shadow-md"
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
              className="h-12 w-7 bg-card border border-primary/20 hover:bg-card rounded-lg shadow-md pointer-events-auto"
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
        <div className={`border-b border-border flex-shrink-0 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between ${
          isParametersFullscreen ? 'ml-12' : ''
        }`}>
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Library tab - only show if educational content exists */}
            {educationalContent && (
              <Button
                variant={activeTab === 'library' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTabChange('library')}
                className="gap-2 min-w-[120px] text-md"
              >
                <BookOpen className="h-5 w-5" />
                Library
              </Button>
            )}
            <Button
              variant={activeTab === 'parameters' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTabChange('parameters')}
              className="gap-2 min-w-[120px] text-md"
            >
              <Sliders className="h-5 w-5" />
              Parameters
            </Button>
            <Button
              variant={activeTab === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTabChange('code')}
              className="gap-2 min-w-[120px] text-md"
            >
              <Code className="h-5 w-5" />
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
              className="gap-2 min-w-[120px] text-md"
              disabled={isBacktesting}
            >
              {isBacktesting ? (
                <Play className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              Backtest
            </Button>
          </div>

          {/* Save Button - Right side */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving || !strategy}
            className="gap-2 min-w-[120px] text-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>

        {/* Scrollable content area */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] px-6 py-4 ${
          isParametersFullscreen ? 'ml-12' : ''
        }`}>
          {activeTab === 'library' && (
            <LibraryEducationalContent />
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
                  <Button onClick={handleRunBacktest} className="gap-2 min-w-[120px] text-md">
                    <Play className="h-5 w-5" />
                    Run Backtest
                  </Button>
                </div>
              )}
              {!isBacktesting && backtestResults && (
                <BacktestResults results={backtestResults} isTransitioning={isTransitioning} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
