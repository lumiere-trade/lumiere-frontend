"use client"

import { useMemo } from "react"
import { Button } from '@lumiere/shared/components/ui/button'
import { ArrowRight } from "lucide-react"

interface StrategyPreviewProps {
  tsdlCode: string
  onViewStrategy: () => void
}

export function StrategyPreview({ tsdlCode, onViewStrategy }: StrategyPreviewProps) {
  // Parse TSDL to extract parameters
  const parsedStrategy = useMemo(() => {
    const lines = tsdlCode.split('\n')
    const params: Record<string, any> = {}
    
    // Extract strategy name
    const nameMatch = tsdlCode.match(/STRATEGY ["']([^"']+)["']/)
    const name = nameMatch ? nameMatch[1] : 'Trading Strategy'
    
    // Extract trading pair
    const pairMatch = tsdlCode.match(/PAIR ["']([^"']+)["']/)
    params.pair = pairMatch ? pairMatch[1] : 'Unknown'
    
    // Extract timeframe
    const timeframeMatch = tsdlCode.match(/TIMEFRAME ["']([^"']+)["']/)
    params.timeframe = timeframeMatch ? timeframeMatch[1] : 'Unknown'
    
    // Extract indicator parameters (RSI, ATR, etc.)
    const indicatorMatches = tsdlCode.matchAll(/INDICATOR\s+(\w+)\s*\(\s*([^)]+)\s*\)/g)
    params.indicators = []
    for (const match of indicatorMatches) {
      const [, indicator, args] = match
      const argPairs = args.split(',').map(a => a.trim())
      const indicatorParams: Record<string, any> = { name: indicator }
      argPairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim())
        indicatorParams[key] = value
      })
      params.indicators.push(indicatorParams)
    }
    
    // Extract conditions
    const buyMatch = tsdlCode.match(/BUY_CONDITION:\s*\n([^END]+)/)
    params.buyCondition = buyMatch ? buyMatch[1].trim() : ''
    
    const sellMatch = tsdlCode.match(/SELL_CONDITION:\s*\n([^END]+)/)
    params.sellCondition = sellMatch ? sellMatch[1].trim() : ''
    
    // Extract risk management
    const stopLossMatch = tsdlCode.match(/STOP_LOSS:\s*([\d.]+)/)
    params.stopLoss = stopLossMatch ? parseFloat(stopLossMatch[1]) : null
    
    const takeProfitMatch = tsdlCode.match(/TAKE_PROFIT:\s*([\d.]+)/)
    params.takeProfit = takeProfitMatch ? parseFloat(takeProfitMatch[1]) : null
    
    const maxPosMatch = tsdlCode.match(/MAX_POSITION_SIZE:\s*([\d.]+)/)
    params.maxPosition = maxPosMatch ? parseFloat(maxPosMatch[1]) : null
    
    const maxTradesMatch = tsdlCode.match(/MAX_TRADES_PER_DAY:\s*(\d+)/)
    params.maxTrades = maxTradesMatch ? parseInt(maxTradesMatch[1]) : null
    
    // Extract position sizing
    const positionMethodMatch = tsdlCode.match(/METHOD:\s*(\w+)/)
    params.positionMethod = positionMethodMatch ? positionMethodMatch[1] : 'fixed'
    
    const sizeMatch = tsdlCode.match(/SIZE:\s*([\w.]+)/)
    params.positionSize = sizeMatch ? sizeMatch[1] : null
    
    return { name, params }
  }, [tsdlCode])

  return (
    <div className="space-y-4">
      {/* Strategy Overview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Strategy Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Trading Pair</p>
            <p className="text-sm font-medium">{parsedStrategy.params.pair}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Timeframe</p>
            <p className="text-sm font-medium">{parsedStrategy.params.timeframe}</p>
          </div>
        </div>
      </div>

      {/* Indicators */}
      {parsedStrategy.params.indicators && parsedStrategy.params.indicators.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Indicators</h3>
          <div className="space-y-2">
            {parsedStrategy.params.indicators.map((indicator: any, idx: number) => (
              <div key={idx} className="bg-primary/5 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium">{indicator.name}</p>
                {Object.entries(indicator).filter(([key]) => key !== 'name').map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entry/Exit Conditions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Conditions</h3>
        <div className="space-y-2">
          <div className="bg-green-500/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Buy When</p>
            <p className="text-sm font-mono">{parsedStrategy.params.buyCondition}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Sell When</p>
            <p className="text-sm font-mono">{parsedStrategy.params.sellCondition}</p>
          </div>
        </div>
      </div>

      {/* Risk Management */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Risk Management</h3>
        <div className="grid grid-cols-2 gap-3">
          {parsedStrategy.params.stopLoss && (
            <div>
              <p className="text-xs text-muted-foreground">Stop Loss</p>
              <p className="text-sm font-medium">{parsedStrategy.params.stopLoss}%</p>
            </div>
          )}
          {parsedStrategy.params.takeProfit && (
            <div>
              <p className="text-xs text-muted-foreground">Take Profit</p>
              <p className="text-sm font-medium">{parsedStrategy.params.takeProfit}%</p>
            </div>
          )}
          {parsedStrategy.params.maxPosition && (
            <div>
              <p className="text-xs text-muted-foreground">Max Position</p>
              <p className="text-sm font-medium">{(parsedStrategy.params.maxPosition * 100).toFixed(0)}%</p>
            </div>
          )}
          {parsedStrategy.params.maxTrades && (
            <div>
              <p className="text-xs text-muted-foreground">Max Trades/Day</p>
              <p className="text-sm font-medium">{parsedStrategy.params.maxTrades}</p>
            </div>
          )}
        </div>
      </div>

      {/* Position Sizing */}
      {parsedStrategy.params.positionMethod && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Position Sizing</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Method</p>
              <p className="text-sm font-medium capitalize">{parsedStrategy.params.positionMethod}</p>
            </div>
            {parsedStrategy.params.positionSize && (
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-medium">{parsedStrategy.params.positionSize}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Strategy Button */}
      <Button
        onClick={onViewStrategy}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        View Strategy
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
