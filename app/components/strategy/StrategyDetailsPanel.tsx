"use client"

import { useState } from "react"
import { BookOpen, Sliders, Code, Play, ChevronRight, ChevronLeft, Save, Loader2, Rocket, StopCircle } from "lucide-react"
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
import {
  useDeployStrategy,
  useStopStrategy
} from "@/hooks/mutations/use-chevalier-mutations"
import { useStrategy } from "@/contexts/StrategyContext"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { toast } from "sonner"

interface StrategyDetailsPanelProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: 'library' | 'parameters' | 'code' | 'backtest'
  onTabChange: (tab: 'library' | 'parameters' | 'code' | 'backtest') => void
}

export function StrategyDetailsPanel({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
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
    isDirty
  } = useStrategy()

  const runBacktestMutation = useRunBacktest()
  const createStrategyMutation = useCreateStrategy()
  const updateStrategyMutation = useUpdateStrategy()
  const createConversationMutation = useCreateConversation()
  const deployStrategyMutation = useDeployStrategy()
  const stopStrategyMutation = useStopStrategy()

  // Deployment status (simulated for now - will be replaced with real query)
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deployed' | 'deploying' | 'stopping'>('idle')

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

      updateEditedStrategy({ name: editedName })

      updateStrategy({
        name: editedName,
        description: editedStrategy.description,
        tsdl: { ...editedStrategy, name: editedName }
      })

      let strategyId: string

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

  const handleDeploy = async () => {
    if (!strategy?.id) {
      toast.error('Please save strategy before deploying')
      return
    }

    if (isDirty) {
      toast.error('Please save changes before deploying')
      return
    }

    try {
      setDeploymentStatus('deploying')
      log.info('Deploying strategy', { strategyId: strategy.id })

      await deployStrategyMutation.mutateAsync(strategy.id)
      
      setDeploymentStatus('deployed')
      updateStrategy({ status: 'active' })
    } catch (error) {
      log.error('Failed to deploy strategy', { error })
      setDeploymentStatus('idle')
    }
  }

  const handleStop = async () => {
    if (!strategy?.id) return

    try {
      setDeploymentStatus('stopping')
      log.info('Stopping strategy', { strategyId: strategy.id })

      await stopStrategyMutation.mutateAsync(strategy.id)
      
      setDeploymentStatus('idle')
      updateStrategy({ status: 'paused' })
    } catch (error) {
      log.error('Failed to stop strategy', { error })
      setDeploymentStatus('deployed')
    }
  }

  const isSaving = createStrategyMutation.isPending ||
                   updateStrategyMutation.isPending ||
                   createConversationMutation.isPending

  const isDeploymentLoading = deploymentStatus === 'deploying' || deploymentStatus === 'stopping'

  const canDeploy = strategy?.id && !isDirty && deploymentStatus === 'idle'
  const isDeployed = deploymentStatus === 'deployed' || strategy?.status === 'active'

  return (
    <>
      {/* Collapsed state - thin strip on right */}
      <div
        className="fixed right-0 top-0 h-screen w-8 z-10 bg-card border-l border-primary/20 transition-transform duration-300 ease-in-out"
        style={{
          transform: isOpen ? 'translateX(100%)' : 'translateX(0)',
        }}
      >
        <div className="h-full flex items-center justify-center" style={{ marginTop: '54px' }}>
          <button
            onClick={onToggle}
            className="h-full w-full px-2 hover:bg-card transition-colors"
            title="Open strategy details"
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Expanded state - fixed 50vw width */}
      <div
        className="fixed right-0 top-[54px] h-[calc(100vh-54px)] bg-background border-l border-border z-10 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: '50vw',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Close button */}
        {isOpen && (
          <div
            className="absolute top-0 h-full flex items-center justify-center pointer-events-none z-20"
            style={{
              left: '0',
              transform: 'translate(-50%, 0)',
            }}
          >
            <button
              onClick={onToggle}
              className="h-12 w-7 bg-card border border-primary/20 hover:bg-card rounded-lg shadow-md pointer-events-auto transition-colors"
              title="Close sidebar"
            >
              <ChevronRight className="h-4 w-4 text-primary mx-auto" />
            </button>
          </div>
        )}

        {/* Header with tab navigation and action buttons */}
        <div className="border-b border-border flex-shrink-0 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* LEFT: Tab Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto">
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

          {/* RIGHT: Action Buttons - Deploy THEN Save */}
          <div className="flex items-center gap-2">
            {/* 1. Deploy/Stop Button (LEFT) */}
            {isDeployed ? (
              <Button
                size="sm"
                onClick={handleStop}
                disabled={isDeploymentLoading}
                variant="destructive"
                className="gap-2 min-w-[120px] text-md"
              >
                {deploymentStatus === 'stopping' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <StopCircle className="h-4 w-4" />
                    Stop
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleDeploy}
                disabled={!canDeploy || isDeploymentLoading}
                variant="default"
                className="gap-2 min-w-[120px] text-md bg-green-600 hover:bg-green-700"
              >
                {deploymentStatus === 'deploying' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Deploy
                  </>
                )}
              </Button>
            )}

            {/* 2. Save Button (RIGHT) */}
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
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] px-6 py-4">
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
                <BacktestResults results={backtestResults} isTransitioning={false} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
