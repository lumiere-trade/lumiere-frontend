"use client"

import { useMemo } from "react"
import { useChat } from "@/contexts/ChatContext"

interface StrategyPreviewProps {
  tsdlCode: string
}

interface ParsedIndicator {
  name: string
  variable: string
  source?: string
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

    // INDICATORS section - enhanced to support source parameter
    const indicatorsMatch = tsdlCode.match(/INDICATORS\s+(.*?)\s+END/s)
    params.indicators = []
    if (indicatorsMatch) {
      const indicatorsBlock = indicatorsMatch[1]
      // Enhanced regex to capture both simple and source-based indicators
      // Matches: varName = INDICATOR(params) or varName = INDICATOR(params, source=sourceVar)
      const indicatorLines = indicatorsBlock.split('\n').filter(line => line.includes('='))

      for (const line of indicatorLines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith('#')) continue

        // Match pattern: varName = INDICATOR(args)
        // Args can be: numbers, source=identifier
        const match = trimmedLine.match(/(\w+)\s*=\s*(\w+)\(([^)]*)\)/)
        if (match) {
          const [, varName, indicatorType, argsStr] = match

          // Parse arguments
          const args: string[] = []
          let source: string | undefined

          if (argsStr) {
            // Split by comma, handling source=identifier
            const parts = argsStr.split(',').map(p => p.trim()).filter(p => p)

            for (const part of parts) {
              if (part.startsWith('source=')) {
                source = part.replace('source=', '').trim()
              } else {
                args.push(part)
              }
            }
          }

          // Build display name
          let displayName = `${indicatorType}(${args.join(', ')})`
          if (source) {
            displayName += ` [source: ${source}]`
          }

          params.indicators.push({
            name: displayName,
            variable: varName,
            source: source
          } as ParsedIndicator)
        }
      }
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

  // Parse entry/exit descriptions from TSDL METADATA section
  const parsedDescriptions = useMemo(() => {
    // Parse ENTRY_DESCRIPTION and EXIT_DESCRIPTION from METADATA
    const entryDescMatch = tsdlCode.match(/ENTRY_DESCRIPTION:\s*"([^"]+)"/)
    const exitDescMatch = tsdlCode.match(/EXIT_DESCRIPTION:\s*"([^"]+)"/)

    return {
      entryDescription: entryDescMatch ? entryDescMatch[1] : '',
      exitDescription: exitDescMatch ? exitDescMatch[1] : ''
    }
  }, [tsdlCode])

  // Use descriptions from METADATA section in TSDL code
  const entryDisplay = parsedDescriptions.entryDescription || 'See full TSDL code'
  const exitDisplay = parsedDescriptions.exitDescription || 'See full TSDL code'

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
            {parsedStrategy.params.indicators.map((indicator: ParsedIndicator, idx: number) => (
              <div key={idx} className="border border-primary/20 bg-background rounded-lg p-3">
                <p className="text-base font-medium text-foreground">{indicator.name}</p>
                <p className="text-sm text-muted-foreground">
                  Variable: {indicator.variable}
                  {indicator.source && (
                    <span className="ml-2 text-primary/70">(derived from {indicator.source})</span>
                  )}
                </p>
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
              parsedDescriptions.entryDescription ? '' : 'font-mono'
            }`}>
              {entryDisplay}
            </p>
          </div>
          <div className="border border-primary/20 bg-background rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">Sell When</p>
            <p className={`text-sm text-foreground whitespace-pre-wrap break-words ${
              parsedDescriptions.exitDescription ? '' : 'font-mono'
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
