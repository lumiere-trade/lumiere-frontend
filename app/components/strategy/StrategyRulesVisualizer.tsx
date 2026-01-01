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

    // 0. MACD Histogram (check BEFORE MACD crossover)
    if (ruleLower.includes('macd_histogram')) {
      const crossesAbove = ruleLower.includes('crosses_above') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const crossesBelow = ruleLower.includes('crosses_below') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const isPositive = ruleLower.includes('>') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const isNegative = ruleLower.includes('<') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const isContracting = ruleLower.includes('falling') || ruleLower.includes('contracting')
      const isRising = ruleLower.includes('rising') || ruleLower.includes('expanding')

      // Histogram Crosses Above 0
      if (crossesAbove) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
            <rect x="40" y="60" width="20" height="40" fill="#ef4444" opacity="0.8" />
            <rect x="80" y="60" width="20" height="30" fill="#ef4444" opacity="0.8" />
            <rect x="120" y="60" width="20" height="20" fill="#ef4444" opacity="0.8" />
            <rect x="180" y="40" width="20" height="20" fill="#22c55e" opacity="0.8" />
            <rect x="220" y="30" width="20" height="30" fill="#22c55e" opacity="0.8" />
            <rect x="260" y="20" width="20" height="40" fill="#22c55e" opacity="0.8" />
            <text x="200" textAnchor="middle" y="110" fill="#22c55e" fontSize="12" fontWeight="600">Histogram Crosses Above</text>
          </svg>
        )
      }

      // Histogram Crosses Below 0
      if (crossesBelow) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
            <rect x="40" y="20" width="20" height="40" fill="#22c55e" opacity="0.8" />
            <rect x="80" y="30" width="20" height="30" fill="#22c55e" opacity="0.8" />
            <rect x="120" y="40" width="20" height="20" fill="#22c55e" opacity="0.8" />
            <rect x="180" y="60" width="20" height="20" fill="#ef4444" opacity="0.8" />
            <rect x="220" y="60" width="20" height="30" fill="#ef4444" opacity="0.8" />
            <rect x="260" y="60" width="20" height="40" fill="#ef4444" opacity="0.8" />
            <text x="200" y="110" fill="#ef4444" fontSize="12" fontWeight="600" textAnchor="middle">Histogram Crosses Below</text>
          </svg>
        )
      }

      // Histogram > 0
      if (isPositive) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
            <rect x="80" y="25" width="20" height="35" fill="#22c55e" opacity="0.8" />
            <rect x="120" y="25" width="20" height="35" fill="#22c55e" opacity="0.8" />
            <rect x="160" y="25" width="20" height="35" fill="#22c55e" opacity="0.8" />
            <rect x="200" y="25" width="20" height="35" fill="#22c55e" opacity="0.8" />
            <rect x="240" y="25" width="20" height="35" fill="#22c55e" opacity="0.8" />
            <text x="200" y="110" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">Histogram &gt; 0</text>
          </svg>
        )
      }

      // Histogram < 0
      if (isNegative) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
            <rect x="80" y="60" width="20" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="120" y="60" width="20" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="160" y="60" width="20" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="200" y="60" width="20" height="35" fill="#ef4444" opacity="0.8" />
            <rect x="240" y="60" width="20" height="35" fill="#ef4444" opacity="0.8" />
            <text x="200" y="110" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600" textAnchor="middle">Histogram &lt; 0</text>
          </svg>
        )
      }

      // Histogram Contracting
      if (isContracting) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
            <rect x="70" y="10" width="20" height="50" fill="#22c55e" opacity="0.8" />
            <rect x="110" y="20" width="20" height="40" fill="#22c55e" opacity="0.8" />
            <rect x="150" y="30" width="20" height="30" fill="#22c55e" opacity="0.8" />
            <rect x="190" y="40" width="20" height="20" fill="#22c55e" opacity="0.8" />
            <rect x="230" y="50" width="20" height="10" fill="#22c55e" opacity="0.8" />
            <text x="200" y="110" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">Histogram Contracting</text>
          </svg>
        )
      }

      // Histogram Rising
      if (isRising) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
            <rect x="60" y="45" width="20" height="15" fill="#22c55e" opacity="0.8" />
            <rect x="100" y="35" width="20" height="25" fill="#22c55e" opacity="0.8" />
            <rect x="140" y="25" width="20" height="35" fill="#22c55e" opacity="0.8" />
            <rect x="180" y="15" width="20" height="45" fill="#22c55e" opacity="0.8" />
            <rect x="220" y="5" width="20" height="55" fill="#22c55e" opacity="0.8" />
            <rect x="260" y="-5" width="20" height="65" fill="#22c55e" opacity="0.8" />
            <text x="200" y="110" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">Histogram Rising</text>
          </svg>
        )
      }
    }

    // 0.5. MACD vs Signal (without crossover)
    if (ruleLower.includes('macd') && ruleLower.includes('signal') && !ruleLower.includes('crosses') && !ruleLower.includes('macd_histogram')) {
      const macdAbove = ruleLower.includes('>') || ruleLower.includes('above')
      const macdBelow = ruleLower.includes('<') || ruleLower.includes('below')

      // MACD > Signal
      if (macdAbove) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            {/* Signal line - parallel, below */}
            <line x1="0" y1="75" x2="400" y2="75" stroke="#f97316" strokeWidth="2.5" opacity="0.7" />
            {/* MACD line - parallel, above */}
            <line x1="0" y1="40" x2="400" y2="40" stroke="#3b82f6" strokeWidth="2.5" />
            {/* Labels */}
            <text x="10" y="35" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">MACD</text>
            <text x="10" y="95" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">Signal</text>
            <text x="200" y="110" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">MACD &gt; Signal</text>
          </svg>
        )
      }

      // MACD < Signal
      if (macdBelow) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            {/* Signal line - parallel, above */}
            <line x1="0" y1="40" x2="400" y2="40" stroke="#f97316" strokeWidth="2.5" opacity="0.7" />
            {/* MACD line - parallel, below */}
            <line x1="0" y1="75" x2="400" y2="75" stroke="#3b82f6" strokeWidth="2.5" />
            {/* Labels */}
            <text x="10" y="35" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">Signal</text>
            <text x="10" y="95" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">MACD</text>
            <text x="200" y="110" fill="#ef4444" fontSize="12" fontWeight="600" textAnchor="middle">MACD &lt; Signal</text>
          </svg>
        )
      }
    }

    // 1. MACD Crossover
    if (ruleLower.includes('macd') && ruleLower.includes('crosses') && !ruleLower.includes('macd_histogram')) {
      const crossesAbove = ruleLower.includes('crosses_above')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />

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
          <text x="200" y="110" textAnchor="middle" fill={crossesAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600">
            {crossesAbove ? "Bullish Cross" : "Bearish Cross"}
          </text>
        </svg>
      )
    }

    // 2. EMA/SMA Crossover
    if ((ruleLower.includes('ema') || ruleLower.includes('sma')) && ruleLower.includes('crosses')) {
      const crossesAbove = ruleLower.includes('crosses_above')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <path d="M 0 70 Q 100 68 200 70 T 400 72" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.7" />
          <path d={crossesAbove ? "M 0 85 Q 100 78 200 65 T 400 55" : "M 0 55 Q 100 62 200 75 T 400 85"}
                stroke="#3b82f6" strokeWidth="2" fill="none" />
          <circle cx="200" cy="70" r="6" fill={crossesAbove ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2" />
          <text x="10" y="85" fill="currentColor" opacity="0.5" fontSize="10">Slow MA</text>
          <text x="10" y={crossesAbove ? "100" : "50"} fill="currentColor" opacity="0.5" fontSize="10">Fast MA</text>
          <text x="140" y={crossesAbove ? "25" : "110"} fill={crossesAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600">
            {crossesAbove ? "Golden Cross" : "Death Cross"}
          </text>
        </svg>
      )
    }

    // 3. Price vs MA - Candlestick visualization with wicks and MA breakthrough
    if ((ruleLower.includes('close') || ruleLower.includes('price')) && (ruleLower.includes('ema') || ruleLower.includes('sma')) && (ruleLower.includes('>') || ruleLower.includes('<'))) {
      const above = ruleLower.includes('>')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          {/* MA line - orange */}
          <line x1="0" y1="60" x2="400" y2="60" stroke="#f97316" strokeWidth="2" opacity="0.7" />
          
          {above ? (
            <>
              {/* Candlesticks - 4 below MA, last one breaks above through MA */}
              {/* Red candle 1 - below MA, wick below */}
              <line x1="70" y1="90" x2="70" y2="100" stroke="#ef4444" strokeWidth="2" />
              <rect x="62" y="65" width="16" height="25" fill="#ef4444" opacity="0.8" />
              <line x1="70" y1="65" x2="70" y2="58" stroke="#ef4444" strokeWidth="2" />
              
              {/* Red candle 2 - below MA, wick above */}
              <line x1="140" y1="70" x2="140" y2="63" stroke="#ef4444" strokeWidth="2" />
              <rect x="132" y="70" width="16" height="20" fill="#ef4444" opacity="0.8" />
              <line x1="140" y1="90" x2="140" y2="98" stroke="#ef4444" strokeWidth="2" />
              
              {/* Green candle 3 - below MA, wick above and below */}
              <line x1="210" y1="72" x2="210" y2="65" stroke="#22c55e" strokeWidth="2" />
              <rect x="202" y="72" width="16" height="18" fill="#22c55e" opacity="0.8" />
              <line x1="210" y1="90" x2="210" y2="95" stroke="#22c55e" strokeWidth="2" />
              
              {/* Red candle 4 - below MA, wick below */}
              <line x1="280" y1="68" x2="280" y2="62" stroke="#ef4444" strokeWidth="2" />
              <rect x="272" y="68" width="16" height="22" fill="#ef4444" opacity="0.8" />
              <line x1="280" y1="90" x2="280" y2="100" stroke="#ef4444" strokeWidth="2" />
              
              {/* Green candle 5 - breaks ABOVE MA with wick through */}
              <line x1="350" y1="50" x2="350" y2="20" stroke="#22c55e" strokeWidth="2" />
              <rect x="342" y="50" width="16" height="20" fill="#22c55e" />
              <line x1="350" y1="70" x2="350" y2="90" stroke="#22c55e" strokeWidth="2" />
            </>
          ) : (
            <>
              {/* Candlesticks - 4 above MA, last one breaks below through MA */}
              {/* Green candle 1 - above MA, wick above */}
              <line x1="70" y1="30" x2="70" y2="22" stroke="#22c55e" strokeWidth="2" />
              <rect x="62" y="30" width="16" height="25" fill="#22c55e" opacity="0.8" />
              <line x1="70" y1="55" x2="70" y2="58" stroke="#22c55e" strokeWidth="2" />
              
              {/* Red candle 2 - above MA, wick below */}
              <line x1="140" y1="35" x2="140" y2="28" stroke="#ef4444" strokeWidth="2" />
              <rect x="132" y="35" width="16" height="20" fill="#ef4444" opacity="0.8" />
              <line x1="140" y1="55" x2="140" y2="62" stroke="#ef4444" strokeWidth="2" />
              
              {/* Green candle 3 - above MA, wick above and below */}
              <line x1="210" y1="32" x2="210" y2="25" stroke="#22c55e" strokeWidth="2" />
              <rect x="202" y="32" width="16" height="23" fill="#22c55e" opacity="0.8" />
              <line x1="210" y1="55" x2="210" y2="60" stroke="#22c55e" strokeWidth="2" />
              
              {/* Red candle 4 - above MA, wick above */}
              <line x1="280" y1="38" x2="280" y2="30" stroke="#ef4444" strokeWidth="2" />
              <rect x="272" y="38" width="16" height="17" fill="#ef4444" opacity="0.8" />
              <line x1="280" y1="55" x2="280" y2="58" stroke="#ef4444" strokeWidth="2" />
              
              {/* Red candle 5 - breaks BELOW MA with wick through */}
              <line x1="350" y1="50" x2="350" y2="20" stroke="#ef4444" strokeWidth="2" />
              <rect x="342" y="50" width="16" height="20" fill="#ef4444" />
              <line x1="350" y1="70" x2="350" y2="90" stroke="#ef4444" strokeWidth="2" />
            </>
          )}
          
          {/* Labels */}
          <text x="10" y="55" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">MA</text>
          <text x="200" y="110" fill={above ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600" textAnchor="middle">
            {above ? "Close > MA" : "Close < MA"}
          </text>
        </svg>
      )
    }

    // 4. RSI
    if (ruleLower.includes('rsi') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
      const isOverbought = ruleLower.includes('>') && (ruleLower.includes('70') || ruleLower.includes('65') || ruleLower.includes('60'))
      const isOversold = ruleLower.includes('<') && (ruleLower.includes('30') || ruleLower.includes('35') || ruleLower.includes('40') || ruleLower.includes('25'))
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="20" x2="400" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {isOverbought && <path d="M 0 60 Q 100 50 200 15 T 400 10" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          {isOversold && <path d="M 0 60 Q 100 70 200 105 T 400 110" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          <text x="5" y="18" fill="#ef4444" fontSize="10">70</text>
          <text x="5" y="58" fill="currentColor" opacity="0.5" fontSize="10">50</text>
          <text x="5" y="98" fill="#22c55e" fontSize="10">30</text>
          {isOverbought && <text x="300" y="15" fill="#ef4444" fontSize="12" fontWeight="600">Overbought</text>}
          {isOversold && <text x="300" y="115" fill="#22c55e" fontSize="12" fontWeight="600">Oversold</text>}
        </svg>
      )
    }

    // 5. Bollinger Bands
    if (ruleLower.includes('bollinger')) {
      const touchesLower = ruleLower.includes('lower') || ruleLower.includes('<')
      const touchesUpper = ruleLower.includes('upper') || ruleLower.includes('>')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
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

    // 6. Volume - bars below SMA with one breaking through
    if (ruleLower.includes('volume') && (ruleLower.includes('>') || ruleLower.includes('sma'))) {
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          {/* Volume SMA - straight line */}
          <line x1="0" y1="70" x2="400" y2="70" stroke="#f97316" strokeWidth="2" opacity="0.7" />
          
          {/* Red bars below SMA - no opacity */}
          <rect x="60" y="80" width="20" height="30" fill="#ef4444" />
          <rect x="100" y="85" width="20" height="25" fill="#ef4444" />
          <rect x="140" y="82" width="20" height="28" fill="#ef4444" />
          <rect x="180" y="78" width="20" height="32" fill="#ef4444" />
          
          {/* Green bars - last one breaks through SMA - no opacity */}
          <rect x="220" y="65" width="20" height="45" fill="#22c55e" />
          <rect x="260" y="60" width="20" height="50" fill="#22c55e" />
          <rect x="300" y="30" width="20" height="80" fill="#22c55e" />
          
          {/* Labels */}
          <text x="10" y="65" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">Volume SMA</text>
          <text x="200" y="125" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">High Volume</text>
        </svg>
      )
    }

    // 7. Stochastic
    if (ruleLower.includes('stochastic') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
      const isOverbought = ruleLower.includes('>') && (ruleLower.includes('80') || ruleLower.includes('75'))
      const isOversold = ruleLower.includes('<') && (ruleLower.includes('20') || ruleLower.includes('25'))
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="20" x2="400" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {isOverbought && <path d="M 0 60 Q 100 40 200 10 T 400 5" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          {isOversold && <path d="M 0 60 Q 100 80 200 110 T 400 115" stroke="#3b82f6" strokeWidth="2" fill="none" />}
          <text x="5" y="18" fill="#ef4444" fontSize="10">80</text>
          <text x="5" y="58" fill="currentColor" opacity="0.5" fontSize="10">50</text>
          <text x="5" y="98" fill="#22c55e" fontSize="10">20</text>
          {isOverbought && <text x="300" y="15" fill="#ef4444" fontSize="12" fontWeight="600">Overbought</text>}
          {isOversold && <text x="300" y="115" fill="#22c55e" fontSize="12" fontWeight="600">Oversold</text>}
        </svg>
      )
    }

    // 8. ADX
    if (ruleLower.includes('adx')) {
      const strongTrend = ruleLower.includes('>') && (ruleLower.includes('25') || ruleLower.includes('20'))
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
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
          {strongTrend && <text x="280" y="25" fill="#22c55e" fontSize="12" fontWeight="600">Strong Trend</text>}
        </svg>
      )
    }

    // 9. ATR
    if (ruleLower.includes('atr')) {
      const highVolatility = ruleLower.includes('>')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {highVolatility && (
            <>
              <path d="M 0 75 Q 100 70 200 40 T 400 20" stroke="#f97316" strokeWidth="2" fill="none" />
              <rect x="200" y="20" width="200" height="55" fill="#f97316" opacity="0.1" />
            </>
          )}
          <text x="5" y="78" fill="currentColor" opacity="0.5" fontSize="10">Threshold</text>
          {highVolatility && <text x="260" y="15" fill="#f97316" fontSize="12" fontWeight="600">High Volatility</text>}
        </svg>
      )
    }

    // 10. Trend
    if (ruleLower.includes('rising') || ruleLower.includes('falling')) {
      const isRising = ruleLower.includes('rising')
      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="5,5" />
          <path d={isRising ? "M 0 90 Q 100 80 200 50 T 400 20" : "M 0 20 Q 100 40 200 70 T 400 100"}
                stroke={isRising ? "#22c55e" : "#ef4444"} strokeWidth="3" fill="none" />
          <path d={isRising ? "M 380 25 L 400 20 L 390 35" : "M 380 95 L 400 100 L 390 85"}
                fill={isRising ? "#22c55e" : "#ef4444"} />
          <text x="150" y={isRising ? "15" : "115"} fill={isRising ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600">
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
