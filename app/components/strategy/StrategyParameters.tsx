"use client"

import { useState, useEffect } from "react"
import { Button } from "@lumiere/shared/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Code, Play, Save, Loader2, X, ArrowUp, ArrowDown } from "lucide-react"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"
import { useStrategy } from "@/contexts/StrategyContext"
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
  const { strategy } = useStrategy()
  const createStrategyMutation = useCreateStrategy()
  const updateStrategyMutation = useUpdateStrategy()
  const createConversationMutation = useCreateConversation()
  const runBacktestMutation = useRunBacktest()

  const [showCode, setShowCode] = useState(false)
  const [name, setName] = useState('')
  const [editedStrategy, setEditedStrategy] = useState<StrategyJSON | null>(null)
  const [backtestResults, setBacktestResults] = useState<BacktestResponse | null>(null)

  useEffect(() => {
    if (strategy) {
      setName(strategy.name)
      setEditedStrategy(strategy.tsdl)
    }
  }, [strategy])

  if (!strategy || !editedStrategy) {
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

  const hasIndicators = editedStrategy.indicators && editedStrategy.indicators.length > 0
  const strategyType = 'indicator_based'

  const handleFieldChange = (field: keyof StrategyJSON, value: any) => {
    setEditedStrategy(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSave = async () => {
    if (!editedStrategy || !strategy) return

    try {
      const isEditing = !!strategy.id

      log.info(isEditing ? 'Updating strategy' : 'Creating new strategy', {
        strategyId: strategy.id,
        name
      })

      let strategyId: string

      if (isEditing) {
        await updateStrategyMutation.mutateAsync({
          strategyId: strategy.id,
          updates: {
            name: name || editedStrategy.name,
            description: editedStrategy.description,
            tsdl_code: JSON.stringify(editedStrategy, null, 2),
            base_plugins: [strategyType],
            parameters: editedStrategy
          }
        })
        strategyId = strategy.id
      } else {
        const strategyResponse = await createStrategyMutation.mutateAsync({
          name: name || editedStrategy.name,
          description: editedStrategy.description,
          tsdl_code: JSON.stringify(editedStrategy, null, 2),
          version: '1.0.0',
          base_plugins: [strategyType],
          parameters: editedStrategy
        })
        strategyId = strategyResponse.strategy_id
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
    }
  }

  const handleBacktest = async () => {
    if (!editedStrategy) return

    try {
      const results = await runBacktestMutation.mutateAsync({
        strategy_json: editedStrategy,
        candles: 10000,
        initial_capital: 10000.0,
        cache_results: true
      })

      setBacktestResults(results)
    } catch (error) {
      log.error('Backtest failed', { error })
    }
  }

  const isEditing = !!strategy.id
  const isSaving = createStrategyMutation.isPending ||
                   updateStrategyMutation.isPending ||
                   createConversationMutation.isPending

  return (
    <div className={`w-full space-y-6 ${compact ? 'pb-8' : 'max-w-4xl mx-auto pb-40'}`}>
      {!hideActions && (
        <div className="flex items-center justify-end">
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
        </div>
      )}

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

      {showCode && strategy && (
        <div className="bg-card border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">TSDL JSON</h3>
          </div>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words font-mono overflow-x-auto">
            <code>{JSON.stringify(editedStrategy, null, 2)}</code>
          </pre>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Strategy</h3>

        <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-base font-semibold text-muted-foreground">Type</label>
            <span className="block px-3 py-1.5 bg-primary/10 text-primary rounded-full text-md font-medium w-fit">
              Indicator Based
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-base font-semibold text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-primary/20 rounded-lg text-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-semibold text-foreground">Description</label>
            <p className="text-md text-muted-foreground">
              {editedStrategy.description}
            </p>
          </div>
        </div>
      </div>

      {hasIndicators && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground ">
            Technical Indicators
          </h3>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex flex-wrap gap-2">
              {editedStrategy.indicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-background border border-primary/30 rounded-lg text-md font-mono text-foreground"
                >
                  {indicator}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-5 w-5 text-green-500" />
                <h4 className="text-base font-semibold text-foreground">Entry Conditions</h4>
              </div>

              <div className="space-y-2">
                {editedStrategy.entry_rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-md font-mono text-muted-foreground mt-0.5">{idx}:</span>
                    <span className="text-md font-mono text-foreground">{rule}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-primary/20">
                <p className="text-md text-muted-foreground">Logic:</p>
                <p className="text-md font-mono text-primary">{editedStrategy.entry_logic}</p>
              </div>
            </div>

            <div className="bg-card border border-primary/20 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-5 w-5 text-red-500" />
                <h4 className="text-base font-semibold text-foreground">Exit Conditions</h4>
              </div>

              <div className="space-y-2">
                {editedStrategy.exit_rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-md font-mono text-muted-foreground mt-0.5">{idx}:</span>
                    <span className="text-md font-mono text-foreground">{rule}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-primary/20">
                <p className="text-md text-muted-foreground">Logic:</p>
                <p className="text-md font-mono text-primary">{editedStrategy.exit_logic}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">
              Want to change indicators or conditions? Ask Prophet AI: "Change RSI period to 21" or "Add volume filter"
            </p>
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
                  <SelectItem value="BTC/USDC">BTC/USDC</SelectItem>
                  <SelectItem value="ETH/USDC">ETH/USDC</SelectItem>
                  <SelectItem value="BONK/USDC">BONK/USDC</SelectItem>
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
                  <SelectItem value="30m">30 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Candle interval</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Risk Management</h3>
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4">
          <p className="text-sm text-muted-foreground">
            MVP trades with 100% of available capital. Position sizing will be added in future updates.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                max={20}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">Maximum loss per trade (required)</p>
            </div>
          </div>

          {editedStrategy.take_profit !== null && editedStrategy.take_profit !== undefined && (
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
                  max={50}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Fixed profit target (optional)</p>
              </div>
            </div>
          )}

          {editedStrategy.trailing_stop !== null && editedStrategy.trailing_stop !== undefined && (
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
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Dynamic trailing stop (optional)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
