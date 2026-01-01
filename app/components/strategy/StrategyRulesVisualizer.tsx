"use client"

import { useStrategy } from "@/contexts/StrategyContext"

interface StrategyRulesVisualizerProps {
  mode: 'entry' | 'exit'
  educationalText: string
}

export function StrategyRulesVisualizer({ mode, educationalText }: StrategyRulesVisualizerProps) {
  const { editedStrategy } = useStrategy()

  if (!editedStrategy) return null

  const rules = mode === 'entry' ? editedStrategy.entry_rules : editedStrategy.exit_rules
  if (!rules || rules.length === 0) return null

  // Parse educational text by lines
  const lines = educationalText.split('\n').filter(line => line.trim())

  // Extract rule descriptions (lines starting with numbers)
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

  const renderSVG = (rule: string) => {
    const ruleLower = rule.toLowerCase()

    // 1. MACD Crossover
    if (ruleLower.includes('macd') && ruleLower.includes('crosses')) {
      const crossesAbove = ruleLower.includes('crosses_above')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="5,5" />

          {/* Signal line - reduced thickness */}
          <path d="M 0 70 Q 100 72 200 70 T 400 70" stroke="#f97316" strokeWidth="2.5" fill="none" opacity="0.7" />

          {/* MACD line - curved crossover, reduced thickness */}
          <path d={crossesAbove ? "M 0 90 Q 100 80 200 50 T 400 40" : "M 0 40 Q 100 50 200 80 T 400 90"}
                stroke="#3b82f6" strokeWidth="2.5" fill="none" />

          {/* Intersection point - mathematically calculated */}
          <circle cx={crossesAbove ? "120" : "167"} cy="71" r="6" fill={crossesAbove ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2" />

          {/* Text labels - adjusted positioning for bullish */}
          {crossesAbove ? (
            <>
              <text x="10" y="60" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">Signal</text>
              <text x="10" y="105" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">MACD</text>
            </>
          ) : (
            <>
              <text x="10" y="35" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">MACD</text>
              <text x="10" y="85" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">Signal</text>
            </>
          )}

          {/* Cross label - centered above intersection point */}
          <text x={crossesAbove ? "65" : "110"} y={crossesAbove ? "30" : "110"} fill={crossesAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">
            {crossesAbove ? "Bullish Cross" : "Bearish Cross"}
          </text>
        </svg>
      )
    }

    // 2. EMA/SMA Crossover
    if ((ruleLower.includes('ema') || ruleLower.includes('sma')) && ruleLower.includes('crosses')) {
      const crossesAbove = ruleLower.includes('crosses_above')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <path d="M 0 70 Q 100 68 200 70 T 400 72" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.7" />
          <path d={crossesAbove ? "M 0 85 Q 100 78 200 65 T 400 55" : "M 0 55 Q 100 62 200 75 T 400 85"}
                stroke="#3b82f6" strokeWidth="2" fill="none" />
          <circle cx="200" cy="70" r="6" fill={crossesAbove ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2" />
          <text x="10" y="85" fill="currentColor" opacity="0.5" fontSize="10">Slow MA</text>
          <text x="10" y={crossesAbove ? "100" : "50"} fill="currentColor" opacity="0.5" fontSize="10">Fast MA</text>
          <text x="140" y={crossesAbove ? "25" : "110"} fill={crossesAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">
            {crossesAbove ? "Golden Cross" : "Death Cross"}
          </text>
        </svg>
      )
    }

    // 3. Price vs MA
    if ((ruleLower.includes('close') || ruleLower.includes('price')) && (ruleLower.includes('ema') || ruleLower.includes('sma')) && (ruleLower.includes('>') || ruleLower.includes('<'))) {
      const above = ruleLower.includes('>')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <path d="M 0 70 Q 100 65 200 70 T 400 75" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.7" />
          <path d={above ? "M 0 50 L 50 55 L 100 45 L 150 50 L 200 40 L 250 45 L 300 50 L 350 48 L 400 52" :
                          "M 0 90 L 50 85 L 100 95 L 150 90 L 200 100 L 250 95 L 300 90 L 350 92 L 400 88"}
                stroke={above ? "#22c55e" : "#ef4444"} strokeWidth="2" fill="none" />
          <rect x="0" y={above ? "35" : "75"} width="400" height="30" fill={above ? "#22c55e" : "#ef4444"} opacity="0.1" />
          <text x="10" y="85" fill="currentColor" opacity="0.5" fontSize="12">MA</text>
          <text x="10" y={above ? "45" : "105"} fill={above ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">Price</text>
        </svg>
      )
    }

    // 4. RSI
    if (ruleLower.includes('rsi') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
      const isOverbought = ruleLower.includes('>') && (ruleLower.includes('70') || ruleLower.includes('65') || ruleLower.includes('60'))
      const isOversold = ruleLower.includes('<') && (ruleLower.includes('30') || ruleLower.includes('35') || ruleLower.includes('40') || ruleLower.includes('25'))
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <line x1="0" y1="20" x2="400" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {isOverbought && <path d="M 0 60 Q 100 50 200 15 T 400 10" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          {isOversold && <path d="M 0 60 Q 100 70 200 105 T 400 110" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          <text x="5" y="18" fill="#ef4444" fontSize="10">70</text>
          <text x="5" y="58" fill="currentColor" opacity="0.5" fontSize="10">50</text>
          <text x="5" y="98" fill="#22c55e" fontSize="10">30</text>
          {isOverbought && <text x="300" y="15" fill="#ef4444" fontSize="12" fontWeight="bold">Overbought</text>}
          {isOversold && <text x="300" y="115" fill="#22c55e" fontSize="12" fontWeight="bold">Oversold</text>}
        </svg>
      )
    }

    // 5. Bollinger Bands
    if (ruleLower.includes('bollinger')) {
      const touchesLower = ruleLower.includes('lower') || ruleLower.includes('<')
      const touchesUpper = ruleLower.includes('upper') || ruleLower.includes('>')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <path d="M 0 20 Q 100 22 200 20 T 400 22" stroke="#f97316" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M 0 60 Q 100 58 200 60 T 400 62" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M 0 100 Q 100 98 200 100 T 400 102" stroke="#f97316" strokeWidth="1" fill="none" opacity="0.5" />
          {touchesLower && (
            <>
              <path d="M 0 60 Q 100 80 200 100 L 250 98 L 300 70 T 400 60" stroke="#22c55e" strokeWidth="2" fill="none" />
              <circle cx="200" cy="100" r="6" fill="#22c55e" stroke="white" strokeWidth="2" />
            </>
          )}
          {touchesUpper && (
            <>
              <path d="M 0 60 Q 100 40 200 20 L 250 22 L 300 50 T 400 60" stroke="#ef4444" strokeWidth="2" fill="none" />
              <circle cx="200" cy="20" r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
            </>
          )}
          <text x="10" y="18" fill="currentColor" opacity="0.5" fontSize="10">Upper</text>
          <text x="10" y="58" fill="currentColor" opacity="0.5" fontSize="10">SMA</text>
          <text x="10" y="98" fill="currentColor" opacity="0.5" fontSize="10">Lower</text>
        </svg>
      )
    }

    // 6. Volume
    if (ruleLower.includes('volume') && (ruleLower.includes('>') || ruleLower.includes('sma'))) {
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <path d="M 0 70 Q 100 68 200 70 T 400 72" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.7" />
          <rect x="20" y="80" width="12" height="40" fill="#ef4444" opacity="0.3" />
          <rect x="40" y="75" width="12" height="45" fill="#ef4444" opacity="0.3" />
          <rect x="60" y="85" width="12" height="35" fill="#ef4444" opacity="0.3" />
          <rect x="200" y="30" width="12" height="40" fill="#22c55e" opacity="0.6" />
          <rect x="220" y="25" width="12" height="45" fill="#22c55e" opacity="0.6" />
          <rect x="240" y="35" width="12" height="35" fill="#22c55e" opacity="0.6" />
          <rect x="350" y="75" width="12" height="45" fill="#ef4444" opacity="0.3" />
          <text x="10" y="65" fill="currentColor" opacity="0.5" fontSize="12">Volume SMA</text>
          <text x="200" y="20" fill="#22c55e" fontSize="12" fontWeight="bold">High Volume</text>
        </svg>
      )
    }

    // 7. Stochastic
    if (ruleLower.includes('stochastic') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
      const isOverbought = ruleLower.includes('>') && (ruleLower.includes('80') || ruleLower.includes('75'))
      const isOversold = ruleLower.includes('<') && (ruleLower.includes('20') || ruleLower.includes('25'))
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <line x1="0" y1="20" x2="400" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {isOverbought && <path d="M 0 60 Q 100 40 200 10 T 400 5" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          {isOversold && <path d="M 0 60 Q 100 80 200 110 T 400 115" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          <text x="5" y="18" fill="#ef4444" fontSize="10">80</text>
          <text x="5" y="58" fill="currentColor" opacity="0.5" fontSize="10">50</text>
          <text x="5" y="98" fill="#22c55e" fontSize="10">20</text>
          {isOverbought && <text x="300" y="15" fill="#ef4444" fontSize="12" fontWeight="bold">Overbought</text>}
          {isOversold && <text x="300" y="115" fill="#22c55e" fontSize="12" fontWeight="bold">Oversold</text>}
        </svg>
      )
    }

    // 8. ADX
    if (ruleLower.includes('adx')) {
      const strongTrend = ruleLower.includes('>') && (ruleLower.includes('25') || ruleLower.includes('20'))
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <line x1="0" y1="80" x2="400" y2="80" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {strongTrend && (
            <>
              <path d="M 0 95 Q 100 90 200 60 T 400 30" stroke="#3b82f6" strokeWidth="2" fill="none" />
              <rect x="200" y="30" width="200" height="50" fill="#22c55e" opacity="0.1" />
            </>
          )}
          <text x="5" y="78" fill="#22c55e" fontSize="10">25</text>
          <text x="5" y="98" fill="currentColor" opacity="0.5" fontSize="10">0</text>
          {strongTrend && <text x="280" y="25" fill="#22c55e" fontSize="12" fontWeight="bold">Strong Trend</text>}
        </svg>
      )
    }

    // 9. ATR
    if (ruleLower.includes('atr')) {
      const highVolatility = ruleLower.includes('>')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {highVolatility && (
            <>
              <path d="M 0 75 Q 100 70 200 40 T 400 20" stroke="#f97316" strokeWidth="2" fill="none" />
              <rect x="200" y="20" width="200" height="55" fill="#f97316" opacity="0.1" />
            </>
          )}
          <text x="5" y="78" fill="currentColor" opacity="0.5" fontSize="10">Threshold</text>
          {highVolatility && <text x="260" y="15" fill="#f97316" fontSize="12" fontWeight="bold">High Volatility</text>}
        </svg>
      )
    }

    // 10. Trend
    if (ruleLower.includes('rising') || ruleLower.includes('falling')) {
      const isRising = ruleLower.includes('rising')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-40">
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="5,5" />
          <path d={isRising ? "M 0 90 Q 100 80 200 50 T 400 20" : "M 0 20 Q 100 40 200 70 T 400 100"}
                stroke={isRising ? "#22c55e" : "#ef4444"} strokeWidth="3" fill="none" />
          <path d={isRising ? "M 380 25 L 400 20 L 390 35" : "M 380 95 L 400 100 L 390 85"}
                fill={isRising ? "#22c55e" : "#ef4444"} />
          <text x="150" y={isRising ? "15" : "115"} fill={isRising ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">
            {isRising ? "Rising Trend" : "Falling Trend"}
          </text>
        </svg>
      )
    }

    return null
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="space-y-6">
        {rules.map((rule, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-6 items-start">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed m-0">
                {ruleDescriptions[idx] || ''}
              </pre>
            </div>
            <div className="flex items-center">
              {renderSVG(rule)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
