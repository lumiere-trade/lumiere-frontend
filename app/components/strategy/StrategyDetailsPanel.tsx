"use client"

/**
 * StrategyDetailsPanel - Strategy details panel with deployment state machine
 *
 * State 1 (NOT DEPLOYED): LEFT = Library, Parameters, Code, Backtest | RIGHT = Go Live, Save
 * State 2 (ACTIVE):       LEFT = Live                               | RIGHT = Pause, Stop
 * State 3 (PAUSED):       LEFT = Offline indicator                  | RIGHT = Resume, Stop
 */

import { BookOpen, Sliders, Code, Play, Save, Loader2, Activity, Pause, Square, RotateCcw, WifiOff } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"
import { StrategyParameters } from "./StrategyParameters"
import { StrategyCodeView } from "./StrategyCodeView"
import { BacktestResults } from "./BacktestResults"
import { LiveStrategyView } from "./LiveStrategyView"
import { LibraryEducationalContent } from "./LibraryEducationalContent"
import { LiveDashboardProvider, buildStrategyConfig } from "@/contexts/LiveDashboardContext"
import { useRunBacktest } from "@/hooks/mutations/use-cartographe-mutations"
import {
  useCreateStrategy,
  useUpdateStrategy,
} from "@/hooks/mutations/use-architect-mutations"
import {
  useDeployStrategy,
  usePauseDeployment,
  useResumeDeployment,
  useStopDeployment,
  useUndeployDeployment,
} from "@/hooks/mutations/use-chevalier-mutations"
import { useStrategyDeploymentStatus } from "@/hooks/queries/use-chevalier-queries"
import { useStrategy } from "@/contexts/StrategyContext"
import { useAuth } from "@/hooks/use-auth"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import * as tsdlApi from "@/lib/api/tsdl"

type DeploymentState = 'NOT_DEPLOYED' | 'ACTIVE' | 'PAUSED'

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
  const pauseDeploymentMutation = usePauseDeployment()
  const resumeDeploymentMutation = useResumeDeployment()
  const stopDeploymentMutation = useStopDeployment()
  const undeployDeploymentMutation = useUndeployDeployment()

  // Query deployment status by Architect strategy ID
  const {
    data: deploymentData,
    isLoading: isLoadingDeployment,
    refetch: refetchDeploymentStatus
  } = useStrategyDeploymentStatus(strategy?.id)

  // TSDL validation state for Live tab
  const [validatedData, setValidatedData] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Debug: log deployment data
  useEffect(() => {
    log.info('Deployment status updated', {
      strategyId: strategy?.id,
      deploymentData,
      isLoading: isLoadingDeployment
    })
  }, [deploymentData, isLoadingDeployment, strategy?.id])

  // Determine deployment state
  const getDeploymentState = (): DeploymentState => {
    const status = deploymentData?.status
    if (status === 'ACTIVE') return 'ACTIVE'
    if (status === 'PAUSED') return 'PAUSED'
    return 'NOT_DEPLOYED'
  }

  const deploymentState = getDeploymentState()
  const deploymentId = deploymentData?.deployment_id || null
  const isDeployed = deploymentState === 'ACTIVE' || deploymentState === 'PAUSED'

  // Force tab to 'live' when deployed, 'parameters' when not deployed
  useEffect(() => {
    if (deploymentState === 'ACTIVE' && activeTab !== 'live') {
      onTabChange('live')
    } else if (deploymentState === 'NOT_DEPLOYED' && activeTab === 'live') {
      onTabChange('parameters')
    }
  }, [deploymentState, activeTab, onTabChange])

  // Validate TSDL when in ACTIVE state
  useEffect(() => {
    if (deploymentState !== 'ACTIVE' || !strategy?.tsdl) {
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
  }, [deploymentState, strategy?.tsdl, strategy?.id])

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

  const handleGoLive = async () => {
    if (!strategy?.id) {
      toast.error('Please save strategy before going live')
      return
    }

    if (isDirty) {
      toast.error('Please save changes before going live')
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

      await refetchDeploymentStatus()
      toast.success('Strategy is now live')
    } catch (error) {
      log.error('Failed to deploy strategy', { error })
    }
  }

  const handlePause = async () => {
    if (!deploymentId) return

    try {
      await pauseDeploymentMutation.mutateAsync(deploymentId)
      await refetchDeploymentStatus()
    } catch (error) {
      log.error('Failed to pause deployment', { error })
    }
  }

  const handleResume = async () => {
    if (!deploymentId) return

    try {
      await resumeDeploymentMutation.mutateAsync(deploymentId)
      await refetchDeploymentStatus()
    } catch (error) {
      log.error('Failed to resume deployment', { error })
    }
  }

  const handleStop = async () => {
    if (!deploymentId) return

    const confirmed = window.confirm(
      'Are you sure you want to stop this strategy? This will close any open positions and undeploy the strategy.'
    )
    if (!confirmed) return

    try {
      await stopDeploymentMutation.mutateAsync(deploymentId)
      await undeployDeploymentMutation.mutateAsync(deploymentId)
      await refetchDeploymentStatus()
      onTabChange('parameters')
      toast.success('Strategy stopped and undeployed')
    } catch (error) {
      log.error('Failed to stop deployment', { error })
    }
  }

  const isSaving = createStrategyMutation.isPending || updateStrategyMutation.isPending
  const isGoingLive = deployStrategyMutation.isPending
  const isPausing = pauseDeploymentMutation.isPending
  const isResuming = resumeDeploymentMutation.isPending
  const isStopping = stopDeploymentMutation.isPending || undeployDeploymentMutation.isPending

  const canGoLive = !!strategy?.id && !isDirty

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header with state-based navigation and actions */}
      <div className="border-b border-border flex-shrink-0 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">

        {/* LEFT SIDE - State-dependent tabs/indicators */}
        <div className="flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {deploymentState === 'NOT_DEPLOYED' && (
            <>
              {educationalContent && (
                <Button
                  variant={activeTab === 'library' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTabChange('library')}
                  className="gap-2 flex-shrink-0"
                >
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">Library</span>
                </Button>
              )}
              <Button
                variant={activeTab === 'parameters' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTabChange('parameters')}
                className="gap-2 flex-shrink-0"
              >
                <Sliders className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Parameters</span>
              </Button>
              <Button
                variant={activeTab === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTabChange('code')}
                className="gap-2 flex-shrink-0"
              >
                <Code className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Code</span>
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
                disabled={isBacktesting}
                className="gap-2 flex-shrink-0"
              >
                {isBacktesting ? (
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                ) : (
                  <Play className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="hidden sm:inline whitespace-nowrap">Backtest</span>
              </Button>
            </>
          )}

          {deploymentState === 'ACTIVE' && (
            <Button
              variant="default"
              size="sm"
              className="gap-2 flex-shrink-0"
            >
              <Activity className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Live</span>
            </Button>
          )}

          {deploymentState === 'PAUSED' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0"
              disabled
            >
              <WifiOff className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Offline</span>
            </Button>
          )}
        </div>

        {/* RIGHT SIDE - State-dependent action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {deploymentState === 'NOT_DEPLOYED' && (
            <>
              <Button
                size="sm"
                onClick={handleGoLive}
                disabled={!canGoLive || isGoingLive}
                className="gap-2"
              >
                {isGoingLive ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Starting...</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Go Live</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || isSaving || !strategy}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
            </>
          )}

          {deploymentState === 'ACTIVE' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={isPausing}
                className="gap-2"
              >
                {isPausing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Pause</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={isStopping}
                className="gap-2"
              >
                {isStopping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Stop</span>
              </Button>
            </>
          )}

          {deploymentState === 'PAUSED' && (
            <>
              <Button
                size="sm"
                onClick={handleResume}
                disabled={isResuming}
                className="gap-2"
              >
                {isResuming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Resume</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={isStopping}
                className="gap-2"
              >
                {isStopping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Stop</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] px-6 py-4">
        {/* NOT_DEPLOYED state content */}
        {deploymentState === 'NOT_DEPLOYED' && (
          <>
            {activeTab === 'library' && (
              <LibraryEducationalContent />
            )}

            {activeTab === 'parameters' && (
              <StrategyParameters
                hideActions={true}
                compact={true}
                readOnly={false}
              />
            )}

            {activeTab === 'code' && (
              <StrategyCodeView />
            )}

            {activeTab === 'backtest' && (
              <div>
                {isBacktesting ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-lg font-semibold">Running backtest...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take up to 60 seconds
                    </p>
                  </div>
                ) : !backtestResults ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No backtest results yet</p>
                    <Button onClick={handleRunBacktest} className="gap-2">
                      <Play className="h-4 w-4" />
                      Run Backtest
                    </Button>
                  </div>
                ) : (
                  <BacktestResults results={backtestResults} isTransitioning={false} />
                )}
              </div>
            )}
          </>
        )}

        {/* ACTIVE state content - Live view */}
        {deploymentState === 'ACTIVE' && (
          <div>
            {isValidating ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-lg font-semibold">Connecting to live data...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Validating strategy and establishing connection
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
                  deploymentStatus="ACTIVE"
                  deploymentVersion={deploymentData?.version || 1}
                  isPaperTrading={deploymentData?.is_paper_trading ?? true}
                />
              </LiveDashboardProvider>
            )}
          </div>
        )}

        {/* PAUSED state content - Offline message */}
        {deploymentState === 'PAUSED' && (
          <div className="text-center py-12">
            <WifiOff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">Strategy Paused</p>
            <p className="text-muted-foreground mb-6">
              Your strategy is currently offline. No trades will be executed while paused.
            </p>
            <Button
              onClick={handleResume}
              disabled={isResuming}
              className="gap-2"
            >
              {isResuming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resuming...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Resume Trading
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
