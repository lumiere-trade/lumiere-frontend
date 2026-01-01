"use client"

import { useStrategy } from "@/contexts/StrategyContext"
import { parseRule } from "./visualizers/rule-parser"
import {
  CrossoverPattern,
  BandPattern,
  VolumePattern,
  ThresholdPattern,
  CandlestickPattern,
  TrendPattern,
  MACDHistogramPattern,
  MAComparisonPattern,
} from "./visualizers/patterns"

interface StrategyRulesVisualizerProps {
  mode: 'entry' | 'exit'
  educationalText: string
}

export function StrategyRulesVisualizer({ mode, educationalText }: StrategyRulesVisualizerProps) {
  const { editedStrategy } = useStrategy()

  if (!editedStrategy) return null

  const rules = mode === 'entry' ? editedStrategy.entry_rules : editedStrategy.exit_rules
  if (!rules || rules.length === 0) return null

  // Parse educational text into rule descriptions
  const lines = educationalText.split('\n').filter(line => line.trim())
  const ruleDescriptions: string[] = []
  let currentRule = ''

  lines.forEach(line => {
    const trimmed = line.trim()
    if (/^\d+\./.test(trimmed)) {
      if (currentRule) {
        ruleDescriptions.push(currentRule)
      }
      currentRule = trimmed
    } else if (currentRule && trimmed.startsWith('-')) {
      currentRule += '\n' + trimmed
    }
  })
  if (currentRule) {
    ruleDescriptions.push(currentRule)
  }

  // Render visualization for each rule
  const renderVisualization = (rule: string, index: number) => {
    const parsed = parseRule(rule)
    
    switch (parsed.type) {
      case 'macd_histogram':
        return <MACDHistogramPattern condition={parsed.params.condition} />
      
      case 'macd_crossover':
        return (
          <CrossoverPattern
            type={parsed.params.direction === 'above' ? 'macd_bullish' : 'macd_bearish'}
            fastLabel="MACD"
            slowLabel="Signal"
          />
        )
      
      case 'macd_comparison':
        return (
          <CrossoverPattern
            type={parsed.params.operator === 'gt' ? 'macd_bullish' : 'macd_bearish'}
            fastLabel="MACD"
            slowLabel="Signal"
          />
        )
      
      case 'ma_crossover':
        return (
          <CrossoverPattern
            type={parsed.params.direction === 'above' ? 'golden' : 'death'}
            fastLabel={`${parsed.params.type}(${parsed.params.fastPeriod})`}
            slowLabel={`${parsed.params.type}(${parsed.params.slowPeriod})`}
          />
        )
      
      case 'ma_comparison':
        return (
          <MAComparisonPattern
            firstMA={parsed.params.firstMA}
            secondMA={parsed.params.secondMA}
            fastAbove={parsed.params.operator === 'gt'}
          />
        )
      
      case 'price_vs_ma':
        return (
          <CandlestickPattern
            priceAboveMA={parsed.params.operator === 'gt' || parsed.params.operator === 'crosses_above'}
            maPeriod={parsed.params.maPeriod}
            maType={parsed.params.maType}
          />
        )
      
      case 'rsi_threshold':
        return (
          <ThresholdPattern
            type="rsi"
            threshold={parsed.params.threshold}
            operator={parsed.params.operator}
            period={parsed.params.period}
          />
        )
      
      case 'bollinger_bands':
        return <BandPattern touchPoint={parsed.params.band} />
      
      case 'volume_divergence':
        return (
          <VolumePattern
            mode="divergence"
            shortPeriod={parsed.params.shortPeriod}
            longPeriod={parsed.params.longPeriod}
            multiplier={parsed.params.multiplier}
          />
        )
      
      case 'volume_spike':
        return (
          <VolumePattern
            mode="spike"
            shortPeriod={parsed.params.period}
            multiplier={parsed.params.multiplier}
          />
        )
      
      case 'stochastic':
        return (
          <ThresholdPattern
            type="stochastic"
            threshold={parsed.params.threshold}
            operator={parsed.params.operator}
          />
        )
      
      case 'adx':
        return (
          <ThresholdPattern
            type="adx"
            threshold={parsed.params.threshold}
            operator="gt"
          />
        )
      
      case 'atr':
        return (
          <TrendPattern
            direction={parsed.params.condition === 'high_volatility' ? 'rising' : 'falling'}
            indicator="ATR"
          />
        )
      
      case 'trend':
        return <TrendPattern direction={parsed.params.direction} />
      
      default:
        // Unknown rule type - no visualization
        return null
    }
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="space-y-6">
        {rules.map((rule, idx) => {
          const visualization = renderVisualization(rule, idx)
          
          // Skip if no visualization available
          if (!visualization) return null
          
          return (
            <div key={idx} className="grid grid-cols-2 gap-6 items-start">
              {/* Left: Text description */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed m-0">
                  {ruleDescriptions[idx] || ''}
                </pre>
              </div>
              
              {/* Right: Visual diagram */}
              <div className="flex items-center">
                {visualization}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
