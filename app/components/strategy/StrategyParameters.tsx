"use client"

import { useState, useMemo } from "react"
import { Button } from "@lumiere/shared/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Code, Play, Save, Loader2, X, ArrowUp, ArrowDown, Pencil, Check } from "lucide-react"
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
import { TokenSelector } from "@/components/strategy/TokenSelector"
import { useChronicler } from "@/hooks"
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
  const { strategy, editedStrategy, editedName, updateEditedStrategy, setEditedName, updateStrategy, isDirty } = useStrategy()
  const { tokens } = useChronicler()
  const createStrategyMutation = useCreateStrategy()
  const updateStrategyMutation = useUpdateStrategy()
  const createConversationMutation = useCreateConversation()
  const runBacktestMutation = useRunBacktest()

  const [showCode, setShowCode] = useState(false)
  const [backtestResults, setBacktestResults] = useState<BacktestResponse | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [tempDescription, setTempDescription] = useState('')

  // Find token address from symbol (e.g., "SOL/USDC" -> SOL address)
  const selectedTokenAddress = useMemo(() => {
    if (!editedStrategy?.symbol) return undefined;

    const symbolPart = editedStrategy.symbol.split('/')[0];
    const token = tokens.find(t => t.symbol === symbolPart);
    return token?.address;
  }, [editedStrategy?.symbol, tokens]);

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
    updateEditedStrategy({ [field]: value })
  }

  const handleTokenChange = (tokenAddress: string, tokenSymbol: string) => {
    // Convert symbol to "SYMBOL/USDC" format for strategy
    const tradingPair = `${tokenSymbol}/USDC`;
    handleFieldChange('symbol', tradingPair);

    log.info('Token changed', { tokenAddress, tokenSymbol, tradingPair });
  }

  // Name editing handlers
  const handleStartEditName = () => {
    setTempName(editedName)
    setIsEditingName(true)
  }

  const handleConfirmName = () => {
    setEditedName(tempName)
    setIsEditingName(false)
  }

  const handleCancelEditName = () => {
    setTempName('')
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmName()
    } else if (e.key === 'Escape') {
      handleCancelEditName()
    }
  }

  // Description editing handlers
  const handleStartEditDescription = () => {
    setTempDescription(editedStrategy.description)
    setIsEditingDescription(true)
  }

  const handleConfirmDescription = () => {
    handleFieldChange('description', tempDescription)
    setIsEditingDescription(false)
  }

  const handleCancelEditDescription = () => {
    setTempDescription('')
    setIsEditingDescription(false)
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEditDescription()
    }
    // Note: Enter not used for textarea to allow multiline
  }

  const handleSave = async () => {
    if (!editedStrategy || !strategy) return

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
            name: editedName || editedStrategy.name,
            description: editedStrategy.description,
            tsdl_code: JSON.stringify({ ...editedStrategy, name: editedName }, null, 2),
            base_plugins: [strategyType],
            parameters: { ...editedStrategy, name: editedName }
          }
        })
        strategyId = strategy.id
      } else {
        const strategyResponse = await createStrategyMutation.mutateAsync({
          name: editedName || editedStrategy.name,
          description: editedStrategy.description,
          tsdl_code: JSON.stringify({ ...editedStrategy, name: editedName }, null, 2),
          version: '1.0.0',
          base_plugins: [strategyType],
          parameters: { ...editedStrategy, name: editedName }
        })
        strategyId = strategyResponse.strategy_id

        // Update with new ID from backend
        updateStrategy({ id: strategyId })
      }

      // Save conversation if exists
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

      // Show reminder to save if dirty
      if (isDirty) {
        toast.info('Strategy tested successfully. Remember to save your changes!')
      }
    } catch (error) {
      log.error('Backtest failed', { error })
    }
  }

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
              disabled={!isDirty || isSaving}
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
                  Save
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

      {/* Strategy Header - Name, Type Badge, Description */}
      <div className="space-y-4">
        {/* Strategy Name with Edit */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                autoFocus
                className="text-xl font-semibold text-foreground bg-background border border-primary/30 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1"
              />
              <button
                onClick={handleConfirmName}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-green-600"
                title="Confirm"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={handleCancelEditName}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground">{editedName}</h2>
              <button
                onClick={handleStartEditName}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Edit name"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Type Badge */}
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
          Indicator Based
        </span>

        {/* Description with Edit */}
        <div className="group">
          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                autoFocus
                rows={3}
                className="w-full text-muted-foreground bg-background border border-primary/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmDescription}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={handleCancelEditDescription}
                  className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="text-muted-foreground leading-relaxed flex-1">
                {editedStrategy.description}
              </p>
              <button
                onClick={handleStartEditDescription}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                title="Edit description"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
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
              <TokenSelector
                value={selectedTokenAddress}
                onChange={handleTokenChange}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Selected: {editedStrategy.symbol || 'None'}
              </p>
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
