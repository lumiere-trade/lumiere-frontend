"use client"

/**
 * StrategyDetailsPanel - Strategy details panel
 * Used inside RightPanel flex layout (not fixed positioning)
 * Always takes full height of parent container
 */

import { BookOpen, Sliders, Code, Play, Save, Loader2, Activity } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"
import { StrategyCodeView } from "./StrategyCodeView"
import { BacktestResults } from "./BacktestResults"
import { LiveStrategyView } from "./LiveStrategyView"
import { LibraryEducationalContent } from "./LibraryEducationalContent"
import { StrategyStatusBadge } from "./StrategyStatusBadge"
import { LiveDashboardProvider, buildStrategyConfig } from "@/contexts/LiveDashboardContext"
import { useRunBacktest } from "@/hooks/mutations/use-cartographe-mutations"
import {
  useCreateStrategy,
  useUpdateStrategy,
} from "@/hooks/mutations/use-architect-mutations"
import {
  useDeployStrategy
} from "@/hooks/mutations/use-chevalier-mutations"
import { useStrategyDeploymentStatus } from "@/hooks/queries/use-chevalier-queries"
import { useStrategy } from "@/contexts/StrategyContext"
import { useAuth } from "@/hooks/use-auth"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import * as tsdlApi from "@/lib/api/tsdl"

interface StrategyDetailsPanelProps {
  activeTab: 'library' | 'parameters' | 'code' | 'backtest' | 'live'
  onTabChange: (tab: 'library' | 'parameters' | 'code' | 'backtest' | 'live') => void
}

export function StrategyDetailsPanel({
  activeTab,
  onTabChange,
}: StrategyDetailsPanelProps) {
  const log = useLogger('StrategyDetailsPanel', LogCategory.COMPONENT)
  const { user } = useAuth()

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
  const deployStrategyMutation = useDeployStrategy()

  // Query deployment status by Architect strategy ID
  const {
    data: deploymentData,
    isLoading: isLoadingDeployment,
    refetch: refetchDeploymentStatus
  } = useStrategyDeploymentStatus(strategy?.id)

  // TSDL validation state for Live tab
  const [validatedData, setValidatedData] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('[StrategyDetailsPanel] Deployment state:', {
      architectStrategyId: strategy?.id,
      deploymentId: deploymentData?.deployment_id,
      status: deploymentData?.status,
      isLoading: isLoadingDeployment,
      isLibraryStrategy: !!strategy?.userId && !!user?.id && strategy.userId !== user.id
    })
  }, [strategy?.id, deploymentData, isLoadingDeployment, strategy?.userId, user?.id])

  const isLibraryStrategy = !!strategy?.userId && !!user?.id && strategy.userId !== user.id
  const deploymentStatus = deploymentData?.status || null
  const deploymentId = deploymentData?.deployment_id || null

  // Live tab is enabled only if deployment is ACTIVE or PAUSED
  const isLiveTabEnabled = deploymentStatus && (deploymentStatus === 'ACTIVE' || deploymentStatus === 'PAUSED')

  // Live tab is ALWAYS shown (not dependent on library status)
  const showLiveTab = true

  // Can deploy if: strategy is saved, no unsaved changes, not a library strategy
  const canDeploy = !!strategy?.id && !isDirty && !isLibraryStrategy

  // Validate TSDL when Live tab is active and we have deployment
  useEffect(() => {
    if (activeTab !== 'live' || !isLiveTabEnabled || !strategy?.tsdl) {
      return
    }

    let cancelled = false
    setIsValidating(true)

    async function validateTsdl() {
      try {
        const validated = await tsdlApi.extractAll(strategy.tsdl)

        if (!cancelled) {
          setValidatedData(validated)
          log.info('[Live Tab] TSDL validated', { validated })
        }
      } catch (error) {
        log.error('[Live Tab] TSDL validation failed', { error })
        if (!cancelled) {
          setValidatedData(null)
        }
      } finally {
        if (!cancelled) {
          setIsValidating(false)
        }
      }
    }

    validateTsdl()

    return () => {
      cancelled = true
    }
  }, [activeTab, isLiveTabEnabled, strategy?.tsdl, strategy?.id])

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
            tsdl_code: JSON.stringify({ ...editedStrategy, name: editedName }, null, 2)
          }
        })
        strategyId = strategy.id
      } else {
        const strategyResponse = await createStrategyMutation.mutateAsync({
          name: editedName,
          tsdl_code: JSON.stringify({ ...editedStrategy, name: editedName }, null, 2),
          version: '1.0.0'
        })
        strategyId = strategyResponse.id

        updateStrategy({ id: strategyId })
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

    if (!editedStrategy) {
      toast.error('Strategy data not available')
      return
    }

    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      log.info('Deploying strategy', {
        architectStrategyId: strategy.id,
        userId: user.id
      })

      await deployStrategyMutation.mutateAsync({
        strategy_id: strategy.id,
        user_id: user.id,
        strategy_json: editedStrategy,
        initial_capital: 10000,
        is_paper_trading: true,
      })

      // Refetch deployment status after deploy
      await refetchDeploymentStatus()

      // Auto-switch to Live tab after successful deployment
      onTabChange('live')

      toast.success('Strategy deployed successfully')
    } catch (error) {
      log.error('Failed to deploy strategy', { error })
    }
  }

  const handleActionComplete = () => {
    // Refetch deployment status after any lifecycle action
    refetchDeploymentStatus()
  }

  const handleLiveTabClick = () => {
    if (!isLiveTabEnabled) {
      toast.error('Please deploy the strategy first to view live data')
      return
    }
    onTabChange('live')
  }

  const isSaving = createStrategyMutation.isPending ||
                   updateStrategyMutation.isPending

  const isDeploying = deployStrategyMutation.isPending

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
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

          {/* Live Tab - ALWAYS visible, disabled if not deployed */}
          {showLiveTab && (
            <Button
              variant={activeTab === 'live' ? 'default' : 'outline'}
              size="sm"
              onClick={handleLiveTabClick}
              disabled={!isLiveTabEnabled}
              className="gap-2 min-w-[120px] text-md"
            >
              <Activity className="h-5 w-5" />
              Live
            </Button>
          )}
        </div>

        {/* RIGHT: Action Buttons - ONLY for owned strategies */}
        {!isLibraryStrategy && (
          <div className="flex items-center gap-2">
            {/* Status Badge with Dropdown Actions - Always shown */}
            {!isLoadingDeployment && (
              <StrategyStatusBadge
                status={deploymentStatus}
                deploymentId={deploymentId}
                architectStrategyId={strategy?.id}
                onActionComplete={handleActionComplete}
                onDeploy={handleDeploy}
                isDeploying={isDeploying}
                canDeploy={canDeploy}
              />
            )}

            {/* Save Button */}
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
        )}
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

        {activeTab === 'live' && (
          <div>
            {!isLiveTabEnabled ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">Strategy Not Deployed</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Deploy your strategy to view live trading data and monitor performance in real-time.
                </p>
                <Button
                  onClick={handleDeploy}
                  disabled={!canDeploy || isDeploying}
                  className="gap-2"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Deploy Strategy
                    </>
                  )}
                </Button>
              </div>
            ) : isValidating ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-lg font-semibold">Connecting to live data...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Validating strategy and establishing WebSocket connection
                </p>
              </div>
            ) : !validatedData ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">Failed to load live data</p>
                <p className="text-sm text-muted-foreground">
                  Strategy validation failed. Please check your strategy configuration.
                </p>
              </div>
            ) : (
              <LiveDashboardProvider
                userId={user!.id}
                config={buildStrategyConfig(
                  deploymentId!,
                  strategy!.id,
                  validatedData.name,
                  {
                    symbol: validatedData.symbol,
                    timeframe: validatedData.timeframe,
                    indicators: validatedData.indicators
                  }
                )}
                initialCapital={deploymentData?.current_capital || 10000}
              >
                <LiveStrategyView
                  deploymentStatus={deploymentStatus!}
                  deploymentVersion={deploymentData?.version || 1}
                  isPaperTrading={deploymentData?.is_paper_trading ?? true}
                />
              </LiveDashboardProvider>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
