"use client"

import { useMemo } from "react"
import { useChat } from "@/contexts/ChatContext"

interface StrategyPreviewProps {
  tsdlCode: string
}

export function StrategyPreview({ tsdlCode }: StrategyPreviewProps) {
  const { strategyMetadata } = useChat()

  const parsedStrategy = useMemo(() => {
    const params: Record<string, any> = {}

    // ASSET section - SYMBOL and TIMEFRAME
    const symbolMatch = tsdlCode.match(/SYMBOL:\s*["']([^"']+)["']/)
    params.pair = symbolMatch ? symbolMatch[1] : 'Unknown'

    const timeframeMatch = tsdlCode.match(/TIMEFRAME:\s*(\S+)/)
    params.timeframe = timeframeMatch ? timeframeMatch[1] : 'Unknown'

    // INDICATORS section
    const indicatorsMatch = tsdlCode.match(/INDICATORS\s+(.*?)\s+END/s)
    params.indicators = []
    if (indicatorsMatch) {
      const indicatorsBlock = indicatorsMatch[1]
      const indicatorLines = indicatorsBlock.match(/(\w+)\s*=\s*(\w+)\(([\d.,\s]*)\)/g)

      if (indicatorLines) {
        for (const line of indicatorLines) {
          const match = line.match(/(\w+)\s*=\s*(\w+)\(([\d.,\s]*)\)/)
          if (match) {
            const [, varName, indicatorType, argsStr] = match
            const args = argsStr.split(',').map(a => a.trim()).filter(a => a)
            params.indicators.push({
              name: `${indicatorType}(${args.join(', ')})`,
              variable: varName
            })
          }
        }
      }
    }

    // ENTRY_CONDITIONS section (extract human-readable conditions)
    const entryMatch = tsdlCode.match(/ENTRY_CONDITIONS\s+(.*?)(?=\s+END)/s)
    if (entryMatch) {
      let conditions = entryMatch[1].trim()
      // Clean up formatting for display
      conditions = conditions
        .replace(/\s+AND\s+/g, ' AND ')
        .replace(/\s+OR\s+/g, ' OR ')
        .replace(/\s+/g, ' ')
      params.buyCondition = conditions
    } else {
      params.buyCondition = ''
    }

    // EXIT_CONDITIONS section (extract only conditions, not TAKE_PROFIT/STOP_LOSS)
    const exitMatch = tsdlCode.match(/EXIT_CONDITIONS\s+(.*?)(?=\s+(?:TAKE_PROFIT|STOP_LOSS|END))/s)
    if (exitMatch) {
      let conditions = exitMatch[1].trim()
      // Clean up formatting
      conditions = conditions
        .replace(/\s+AND\s+/g, ' AND ')
        .replace(/\s+OR\s+/g, ' OR ')
        .replace(/\s+/g, ' ')
      params.sellCondition = conditions
    } else {
      params.sellCondition = ''
    }

    // EXIT_CONDITIONS - extract STOP_LOSS, TAKE_PROFIT
    const stopLossMatch = tsdlCode.match(/STOP_LOSS:\s*([\d.]+)/)
    params.stopLoss = stopLossMatch ? parseFloat(stopLossMatch[1]) : null

    const takeProfitMatch = tsdlCode.match(/TAKE_PROFIT:\s*([\d.]+)/)
    params.takeProfit = takeProfitMatch ? parseFloat(takeProfitMatch[1]) : null

    // RISK_MANAGEMENT section
    const maxPosMatch = tsdlCode.match(/MAX_POSITION_SIZE:\s*([\d.]+)/)
    params.maxPosition = maxPosMatch ? parseFloat(maxPosMatch[1]) : null

    const maxTradesMatch = tsdlCode.match(/MAX_TRADES_PER_DAY:\s*(\d+)/)
    params.maxTrades = maxTradesMatch ? parseInt(maxTradesMatch[1]) : null

    // POSITION_SIZING section
    const positionMethodMatch = tsdlCode.match(/METHOD:\s*(\w+)/)
    params.positionMethod = positionMethodMatch ? positionMethodMatch[1] : 'fixed'

    const sizeMatch = tsdlCode.match(/SIZE:\s*([\d.]+)/)
    params.positionSize = sizeMatch ? sizeMatch[1] : null

    return { params }
  }, [tsdlCode])

  // Use human-readable descriptions from metadata if available,
  // otherwise fall back to parsed TSDL conditions
  const entryDisplay = strategyMetadata?.entry_description
    || parsedStrategy.params.buyCondition
    || 'See full TSDL code'

  const exitDisplay = strategyMetadata?.exit_description
    || parsedStrategy.params.sellCondition
    || 'See full TSDL code'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-medium text-muted-foreground">Strategy Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Trading Pair</p>
            <p className="text-base font-medium text-foreground">{parsedStrategy.params.pair}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Timeframe</p>
            <p className="text-base font-medium text-foreground">{parsedStrategy.params.timeframe}</p>
          </div>
        </div>
      </div>

      {parsedStrategy.params.indicators && parsedStrategy.params.indicators.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-medium text-muted-foreground">Indicators</h3>
          <div className="space-y-2">
            {parsedStrategy.params.indicators.map((indicator: any, idx: number) => (
              <div key={idx} className="border border-primary/20 bg-background rounded-lg p-3">
                <p className="text-base font-medium text-foreground">{indicator.name}</p>
                <p className="text-sm text-muted-foreground">Variable: {indicator.variable}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-base font-medium text-muted-foreground">Conditions</h3>
        <div className="space-y-2">
          <div className="border border-primary/20 bg-background rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">Buy When</p>
            <p className={`text-sm text-foreground whitespace-pre-wrap break-words ${
              strategyMetadata?.entry_description ? '' : 'font-mono'
            }`}>
              {entryDisplay}
            </p>
          </div>
          <div className="border border-primary/20 bg-background rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">Sell When</p>
            <p className={`text-sm text-foreground whitespace-pre-wrap break-words ${
              strategyMetadata?.exit_description ? '' : 'font-mono'
            }`}>
              {exitDisplay}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-medium text-muted-foreground">Risk Management</h3>
        <div className="grid grid-cols-2 gap-4">
          {parsedStrategy.params.stopLoss && (
            <div>
              <p className="text-sm text-muted-foreground">Stop Loss</p>
              <p className="text-base font-medium text-foreground">{parsedStrategy.params.stopLoss}%</p>
            </div>
          )}
          {parsedStrategy.params.takeProfit && (
            <div>
              <p className="text-sm text-muted-foreground">Take Profit</p>
              <p className="text-base font-medium text-foreground">{parsedStrategy.params.takeProfit}%</p>
            </div>
          )}
          {parsedStrategy.params.maxPosition && (
            <div>
              <p className="text-sm text-muted-foreground">Max Position</p>
              <p className="text-base font-medium text-foreground">{(parsedStrategy.params.maxPosition * 100).toFixed(0)}%</p>
            </div>
          )}
          {parsedStrategy.params.maxTrades && (
            <div>
              <p className="text-sm text-muted-foreground">Max Trades/Day</p>
              <p className="text-base font-medium text-foreground">{parsedStrategy.params.maxTrades}</p>
            </div>
          )}
        </div>
      </div>

      {parsedStrategy.params.positionMethod && (
        <div className="space-y-2">
          <h3 className="text-base font-medium text-muted-foreground">Position Sizing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Method</p>
              <p className="text-base font-medium text-foreground capitalize">{parsedStrategy.params.positionMethod}</p>
            </div>
            {parsedStrategy.params.positionSize && (
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="text-base font-medium text-foreground">{parsedStrategy.params.positionSize}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
