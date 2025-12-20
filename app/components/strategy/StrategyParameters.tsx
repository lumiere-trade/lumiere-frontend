"use client"

import { useState, useEffect } from "react"
import { Button } from "@lumiere/shared/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Code, Play, Save, Loader2, X, TrendingUp, TrendingDown, Target, Wallet, ChevronsRight, ChevronsLeft } from "lucide-react"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useChat } from "@/contexts/ChatContext"
import { StrategyJSON } from "@/lib/api/prophet"
import {
  useCreateStrategy,
  useUpdateStrategy,
  useCreateConversation
} from "@/hooks/mutations/use-architect-mutations"
import { useRunBacktest } from "@/hooks/mutations/use-cartographe-mutations"
import { BacktestResponse } from "@/lib/api/cartographe"
import { BacktestResults } from "@/components/strategy/BacktestResults"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StrategyParametersProps {
  hideActions?: boolean
  compact?: boolean
}

export function StrategyParameters({ hideActions = false, compact = false }: StrategyParametersProps) {
  const log = useLogger('StrategyParameters', LogCategory.COMPONENT)
  const {
    strategyMetadata,
    generatedStrategy,
    messages,
    currentStrategy,
    isParametersFullscreen,
    expandParametersFullscreen,
    collapseParametersFullscreen
  } = useChat()
  const createStrategyMutation = useCreateStrategy()
  const updateStrategyMutation = useUpdateStrategy()
  const createConversationMutation = useCreateConversation()
  const runBacktestMutation = useRunBacktest()

  const [showCode, setShowCode] = useState(false)
  const [name, setName] = useState('')
  const [editedStrategy, setEditedStrategy] = useState<StrategyJSON | null>(null)
  const [backtestResults, setBacktestResults] = useState<BacktestResponse | null>(null)

  useEffect(() => {
    if (strategyMetadata) {
      setName(strategyMetadata.name)
      setEditedStrategy(strategyMetadata)
    }
  }, [strategyMetadata])

  if (!strategyMetadata || !editedStrategy) {
    return (
      <div className={`w-full space-y-6 ${compact ? 'pb-8' : 'max-w-4xl mx-auto pb-40'}`}>
        <div className="bg-card border border-primary/20 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground text-center">
            No strategy generated yet. Start a conversation with Prophet AI to create a strategy.
          </p>
        </div>
      </div>
    )
  }

  const hasIndicators = editedStrategy.indicators.length > 0
  const hasWallet = editedStrategy.target_wallet !== null
  const hasReversion = editedStrategy.reversion_target !== null

  const strategyType = hasWallet && hasIndicators ? 'hybrid'
    : hasWallet ? 'wallet_following'
    : hasReversion ? 'mean_reversion'
    : 'indicator_based'

  const handleFieldChange = (field: keyof StrategyJSON, value: any) => {
    setEditedStrategy(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSave = async () => {
    if (!editedStrategy || !generatedStrategy) return

    try {
      const isEditing = !!currentStrategy?.id

      log.info(isEditing ? 'Updating strategy' : 'Creating new strategy', {
        strategyId: currentStrategy?.id,
        name
      })

      let strategyId: string

      if (isEditing) {
        await updateStrategyMutation.mutateAsync({
          strategyId: currentStrategy.id,
          updates: {
            name: name || editedStrategy.name,
            description: editedStrategy.description,
            tsdl_code: generatedStrategy.python_code,
            base_plugins: [strategyType],
            parameters: editedStrategy
          }
        })
        strategyId = currentStrategy.id
      } else {
        const strategyResponse = await createStrategyMutation.mutateAsync({
          name: name || editedStrategy.name,
          description: editedStrategy.description,
          tsdl_code: generatedStrategy.python_code,
          version: '1.0.0',
          base_plugins: [strategyType],
          parameters: editedStrategy
        })
        strategyId = strategyResponse.strategy_id
      }

      if (messages.length > 0) {
        await createConversationMutation.mutateAsync({
          strategy_id: strategyId,
          state: 'completed',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            conversation_state: 'completed',
            timestamp: msg.timestamp.toISOString()
          }))
        })
      }

      toast.success(isEditing ? 'Strategy updated' : 'Strategy created')
    } catch (error) {
      log.error('Failed to save strategy', { error })
    }
  }

  const handleBacktest = async () => {
    if (!editedStrategy || !generatedStrategy) return

    try {
      const results = await runBacktestMutation.mutateAsync({
        strategy_json: editedStrategy,
        candles: 2160,
        initial_capital: 10000.0,
        cache_results: true
      })

      setBacktestResults(results)
    } catch (error) {
      log.error('Backtest failed', { error })
    }
  }

  const handleToggleFullscreen = () => {
    if (isParametersFullscreen) {
      collapseParametersFullscreen()
    } else {
      expandParametersFullscreen()
    }
  }

  const isEditing = !!currentStrategy?.id
  const isSaving = createStrategyMutation.isPending ||
                   updateStrategyMutation.isPending ||
                   createConversationMutation.isPending

  return (
    <div className={`w-full space-y-6 ${compact ? 'pb-8' : 'max-w-4xl mx-auto pb-40'}`}>
      {/* Action Bar - Fullscreen винаги видим, останалите според hideActions */}
      <div className="flex items-center justify-between">
        {/* Fullscreen Toggle Button - Left (ВИНАГИ ВИДИМ) */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFullscreen}
          className="gap-2"
        >
          {isParametersFullscreen ? (
            <>
              <ChevronsLeft className="h-4 w-4" />
              Exit Fullscreen
            </>
          ) : (
            <>
              <ChevronsRight className="h-4 w-4" />
              Fullscreen
            </>
          )}
        </Button>

        {/* Action Buttons - Right (само ако hideActions е false) */}
        {!hideActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(!showCode)}
              className="gap-2"
            >
              <Code className="h-4 w-4" />
              {showCode ? "Hide Code" : "View Code"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBacktest}
              disabled={runBacktestMutation.isPending}
              className="gap-2"
            >
              {runBacktestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Backtest
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Update Strategy' : 'Save Strategy'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {backtestResults && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBacktestResults(null)}
            className="absolute -top-2 -right-2 z-10 h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
          <BacktestResults results={backtestResults} />
        </div>
      )}

      {showCode && generatedStrategy && (
        <div className="bg-card border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Generated Python Code</h3>
            <span className="text-sm text-muted-foreground font-mono">{generatedStrategy.strategy_class_name}</span>
          </div>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words font-mono overflow-x-auto">
            <code>{generatedStrategy.python_code}</code>
          </pre>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Strategy Type:</span>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
          {strategyType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>

      <div className="bg-card border border-primary/20 rounded-2xl p-6">
        <div className="space-y-1">
          <label className="text-base font-semibold text-foreground">Strategy Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-primary/20 rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-sm text-muted-foreground">
            {editedStrategy.description}
          </p>
        </div>
      </div>

      {hasIndicators && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Technical Indicators
          </h3>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex flex-wrap gap-2">
              {editedStrategy.indicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-background border border-primary/30 rounded-lg text-sm font-mono text-foreground"
                >
                  {indicator}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h4 className="text-base font-semibold text-foreground">Entry Conditions</h4>
            </div>

            <div className="space-y-2">
              {editedStrategy.entry_rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-sm font-mono text-muted-foreground mt-0.5">{idx}:</span>
                  <span className="text-sm font-mono text-foreground">{rule}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-primary/20">
              <p className="text-sm text-muted-foreground">Logic:</p>
              <p className="text-sm font-mono text-primary">{editedStrategy.entry_logic}</p>
            </div>
          </div>

          <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h4 className="text-base font-semibold text-foreground">Exit Conditions</h4>
            </div>

            <div className="space-y-2">
              {editedStrategy.exit_rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-sm font-mono text-muted-foreground mt-0.5">{idx}:</span>
                  <span className="text-sm font-mono text-foreground">{rule}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-primary/20">
              <p className="text-sm text-muted-foreground">Logic:</p>
              <p className="text-sm font-mono text-primary">{editedStrategy.exit_logic}</p>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">
              Want to change indicators or conditions? Ask Prophet AI: "Change RSI period to 21" or "Add volume filter"
            </p>
          </div>
        </div>
      )}

      {hasWallet && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet Following
          </h3>

          <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Target Wallet</p>
              <p className="text-sm font-mono text-foreground break-all">{editedStrategy.target_wallet}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Execution Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-primary/20 rounded-2xl p-6">
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground">Trading Pair</label>
              <Select
                value={editedStrategy.symbol}
                onValueChange={(value) => handleFieldChange('symbol', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL/USDC">SOL/USDC</SelectItem>
                  <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                  <SelectItem value="BTC/USDC">BTC/USDC</SelectItem>
                  <SelectItem value="ETH/USDC">ETH/USDC</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Asset to trade</p>
            </div>
          </div>

          <div className="bg-card border border-primary/20 rounded-2xl p-6">
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground">Timeframe</label>
              <Select
                value={editedStrategy.timeframe}
                onValueChange={(value) => handleFieldChange('timeframe', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Candle interval</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Risk Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {editedStrategy.stop_loss !== null && (
            <div className="bg-card border border-primary/20 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold text-foreground">Stop Loss</label>
                  <span className="text-base font-mono text-primary">{editedStrategy.stop_loss.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[editedStrategy.stop_loss]}
                  onValueChange={([value]) => handleFieldChange('stop_loss', value)}
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Maximum loss per trade</p>
              </div>
            </div>
          )}

          {editedStrategy.take_profit !== null && (
            <div className="bg-card border border-primary/20 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold text-foreground">Take Profit</label>
                  <span className="text-base font-mono text-primary">{editedStrategy.take_profit.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[editedStrategy.take_profit]}
                  onValueChange={([value]) => handleFieldChange('take_profit', value)}
                  min={0.1}
                  max={20}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Target profit per trade</p>
              </div>
            </div>
          )}

          {editedStrategy.trailing_stop !== null && (
            <div className="bg-card border border-primary/20 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold text-foreground">Trailing Stop</label>
                  <span className="text-base font-mono text-primary">{editedStrategy.trailing_stop.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[editedStrategy.trailing_stop]}
                  onValueChange={([value]) => handleFieldChange('trailing_stop', value)}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Dynamic stop loss distance</p>
              </div>
            </div>
          )}

          {editedStrategy.max_position_size !== null && (
            <div className="bg-card border border-primary/20 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold text-foreground">Max Position Size</label>
                  <span className="text-base font-mono text-primary">{(editedStrategy.max_position_size * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[editedStrategy.max_position_size * 100]}
                  onValueChange={([value]) => handleFieldChange('max_position_size', value / 100)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Maximum capital per trade</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {hasWallet && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Copy Trading Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {editedStrategy.copy_percentage !== null && (
              <div className="bg-card border border-primary/20 rounded-2xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold text-foreground">Copy Percentage</label>
                    <span className="text-base font-mono text-primary">{(editedStrategy.copy_percentage * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[editedStrategy.copy_percentage * 100]}
                    onValueChange={([value]) => handleFieldChange('copy_percentage', value / 100)}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">Percentage of whale trade to copy</p>
                </div>
              </div>
            )}

            {editedStrategy.min_copy_size !== null && (
              <div className="bg-card border border-primary/20 rounded-2xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold text-foreground">Min Copy Size</label>
                    <span className="text-base font-mono text-primary">${editedStrategy.min_copy_size.toFixed(0)}</span>
                  </div>
                  <Slider
                    value={[editedStrategy.min_copy_size]}
                    onValueChange={([value]) => handleFieldChange('min_copy_size', value)}
                    min={10}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">Ignore smaller trades</p>
                </div>
              </div>
            )}

            {editedStrategy.max_copy_size !== null && (
              <div className="bg-card border border-primary/20 rounded-2xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold text-foreground">Max Copy Size</label>
                    <span className="text-base font-mono text-primary">${editedStrategy.max_copy_size.toFixed(0)}</span>
                  </div>
                  <Slider
                    value={[editedStrategy.max_copy_size]}
                    onValueChange={([value]) => handleFieldChange('max_copy_size', value)}
                    min={100}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">Cap maximum trade size</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hasReversion && editedStrategy.entry_threshold !== null && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Mean Reversion Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-primary/20 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold text-foreground">Entry Threshold</label>
                  <span className="text-base font-mono text-primary">{editedStrategy.entry_threshold.toFixed(1)}</span>
                </div>
                <Slider
                  value={[editedStrategy.entry_threshold]}
                  onValueChange={([value]) => handleFieldChange('entry_threshold', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Standard deviations for entry</p>
              </div>
            </div>

            {editedStrategy.exit_threshold !== null && (
              <div className="bg-card border border-primary/20 rounded-2xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold text-foreground">Exit Threshold</label>
                    <span className="text-base font-mono text-primary">{editedStrategy.exit_threshold.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[editedStrategy.exit_threshold]}
                    onValueChange={([value]) => handleFieldChange('exit_threshold', value)}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">Standard deviations for exit</p>
                </div>
              </div>
            )}

            {editedStrategy.lookback_period !== null && (
              <div className="bg-card border border-primary/20 rounded-2xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-semibold text-foreground">Lookback Period</label>
                    <span className="text-base font-mono text-primary">{editedStrategy.lookback_period}</span>
                  </div>
                  <Slider
                    value={[editedStrategy.lookback_period]}
                    onValueChange={([value]) => handleFieldChange('lookback_period', value)}
                    min={10}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">Historical periods to analyze</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
