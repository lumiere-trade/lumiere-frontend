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

  const renderSVG = (rule: string) => {
    const ruleLower = rule.toLowerCase()

    // 0. MACD Histogram
    if (ruleLower.includes('macd_histogram')) {
      const crossesAbove = ruleLower.includes('crosses_above') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const crossesBelow = ruleLower.includes('crosses_below') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const isPositive = ruleLower.includes('>') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const isNegative = ruleLower.includes('<') && (ruleLower.includes('0') || ruleLower.includes('zero'))
      const isContracting = ruleLower.includes('falling') || ruleLower.includes('contracting')
      const isRising = ruleLower.includes('rising') || ruleLower.includes('expanding')

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

      if (macdAbove) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="75" x2="400" y2="75" stroke="#f97316" strokeWidth="2.5" opacity="0.7" />
            <line x1="0" y1="40" x2="400" y2="40" stroke="#3b82f6" strokeWidth="2.5" />
            <text x="10" y="35" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">MACD</text>
            <text x="10" y="95" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">Signal</text>
            <text x="200" y="110" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">MACD &gt; Signal</text>
          </svg>
        )
      }

      if (macdBelow) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="40" x2="400" y2="40" stroke="#f97316" strokeWidth="2.5" opacity="0.7" />
            <line x1="0" y1="75" x2="400" y2="75" stroke="#3b82f6" strokeWidth="2.5" />
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
          <line x1="0" y1="70" x2="400" y2="70" stroke="#f97316" strokeWidth="2.5" opacity="0.7" />
          <path d={crossesAbove ? "M 0 90 Q 100 80 200 50 T 400 40" : "M 0 40 Q 100 50 200 80 T 400 90"}
                stroke="#3b82f6" strokeWidth="2.5" fill="none" />
          <circle cx={crossesAbove ? "120" : "167"} cy="71" r="6" fill={crossesAbove ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2" />
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
          <text x="200" y="110" textAnchor="middle" fill={crossesAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600">
            {crossesAbove ? "Bullish Cross" : "Bearish Cross"}
          </text>
        </svg>
      )
    }

    // 2. EMA/SMA Crossover
    if ((ruleLower.includes('ema') || ruleLower.includes('sma')) && ruleLower.includes('crosses') && !ruleLower.includes('close') && !ruleLower.includes('price')) {
      const crossesAbove = ruleLower.includes('crosses_above')
      const maMatches = rule.match(/(EMA|SMA)\((\d+)\)/gi) || []
      const fastMA = maMatches[0] || 'Fast MA'
      const slowMA = maMatches[1] || 'Slow MA'

      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
          <line x1="0" y1="70" x2="400" y2="70" stroke="#f97316" strokeWidth="2.5" opacity="0.7" />
          <path d={crossesAbove ? "M 0 90 Q 100 80 200 50 T 400 40" : "M 0 40 Q 100 50 200 80 T 400 90"}
                stroke="#3b82f6" strokeWidth="2.5" fill="none" />
          <circle cx={crossesAbove ? "120" : "167"} cy="71" r="6" fill={crossesAbove ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2" />
          {crossesAbove ? (
            <>
              <text x="10" y="60" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{slowMA}</text>
              <text x="10" y="105" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{fastMA}</text>
            </>
          ) : (
            <>
              <text x="10" y="35" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{fastMA}</text>
              <text x="10" y="85" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{slowMA}</text>
            </>
          )}
          <text x="200" y="110" textAnchor="middle" fill={crossesAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600">
            {crossesAbove ? "Golden Cross" : "Death Cross"}
          </text>
        </svg>
      )
    }

    // 2.5. MA Comparison (without crossover) - includes Volume_SMA
    if ((ruleLower.includes('ema') || ruleLower.includes('sma') || ruleLower.includes('volume_sma')) && (ruleLower.includes('>') || ruleLower.includes('<')) && !ruleLower.includes('crosses') && !ruleLower.includes('close') && !ruleLower.includes('price')) {
      const maMatches = rule.match(/(EMA|SMA|Volume_SMA)\((\d+)\)/gi) || []
      if (maMatches.length < 2) return null
      
      // Skip if "Volume > Volume_SMA" (only 1 Volume_SMA, not a comparison)
      const volumeSmaMatches = rule.match(/Volume_SMA\((\d+)\)/gi) || []
      if (volumeSmaMatches.length === 1 && ruleLower.includes('volume') && !ruleLower.includes('volume_sma >') && !ruleLower.includes('volume_sma <')) {
        return null
      }

      const fastAbove = ruleLower.includes('>')
      const firstMA = maMatches[0] || 'Fast MA'
      const secondMA = maMatches[1] || 'Slow MA'

      if (fastAbove) {
        return (
          <svg viewBox="0 0 400 120" className="w-full h-36">
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
            <path d="M 0 95 Q 100 85 200 55 T 400 45" stroke="#f97316" strokeWidth="2.5" opacity="0.7" fill="none" />
            <path d="M 0 60 Q 100 50 200 20 T 400 10" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
            <text x="10" y="35" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{firstMA}</text>
            <text x="10" y="115" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{secondMA}</text>
            <text x="200" y="115" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">{firstMA} &gt; {secondMA}</text>
          </svg>
        )
      }

      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
          <path d="M 0 60 Q 100 50 200 20 T 400 10" stroke="#f97316" strokeWidth="2.5" opacity="0.7" fill="none" />
          <path d="M 0 95 Q 100 85 200 55 T 400 45" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
          <text x="10" y="20" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{secondMA}</text>
          <text x="10" y="105" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{firstMA}</text>
          <text x="200" y="115" fill="#ef4444" fontSize="12" fontWeight="600" textAnchor="middle">{firstMA} &lt; {secondMA}</text>
        </svg>
      )
    }

    // 3. Price vs MA
    if ((ruleLower.includes('close') || ruleLower.includes('price')) && (ruleLower.includes('ema') || ruleLower.includes('sma')) && (ruleLower.includes('>') || ruleLower.includes('<') || ruleLower.includes('crosses'))) {
      const crossesBelow = ruleLower.includes('crosses_below')
      const crossesAbove = ruleLower.includes('crosses_above')
      const above = crossesAbove ? true : crossesBelow ? false : ruleLower.includes('>')
      const maMatch = rule.match(/(EMA|SMA)\((\d+)\)/i)
      const maLabel = maMatch ? maMatch[0] : 'MA'

      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="60" x2="400" y2="60" stroke="#f97316" strokeWidth="2" opacity="0.7" />
          {above ? (
            <>
              <line x1="80" y1="75" x2="80" y2="68" stroke="#22c55e" strokeWidth="2" />
              <rect x="72" y="75" width="16" height="15" fill="#22c55e" opacity="0.8" />
              <line x1="80" y1="90" x2="80" y2="95" stroke="#22c55e" strokeWidth="2" />
              <line x1="120" y1="70" x2="120" y2="63" stroke="#ef4444" strokeWidth="2" />
              <rect x="112" y="70" width="16" height="20" fill="#ef4444" opacity="0.8" />
              <line x1="120" y1="90" x2="120" y2="98" stroke="#ef4444" strokeWidth="2" />
              <line x1="160" y1="73" x2="160" y2="66" stroke="#22c55e" strokeWidth="2" />
              <rect x="152" y="73" width="16" height="17" fill="#22c55e" opacity="0.8" />
              <line x1="160" y1="90" x2="160" y2="96" stroke="#22c55e" strokeWidth="2" />
              <line x1="200" y1="72" x2="200" y2="65" stroke="#ef4444" strokeWidth="2" />
              <rect x="192" y="72" width="16" height="18" fill="#ef4444" opacity="0.8" />
              <line x1="200" y1="90" x2="200" y2="95" stroke="#ef4444" strokeWidth="2" />
              <line x1="240" y1="74" x2="240" y2="67" stroke="#22c55e" strokeWidth="2" />
              <rect x="232" y="74" width="16" height="16" fill="#22c55e" opacity="0.8" />
              <line x1="240" y1="90" x2="240" y2="94" stroke="#22c55e" strokeWidth="2" />
              <line x1="280" y1="68" x2="280" y2="62" stroke="#ef4444" strokeWidth="2" />
              <rect x="272" y="68" width="16" height="22" fill="#ef4444" opacity="0.8" />
              <line x1="280" y1="90" x2="280" y2="100" stroke="#ef4444" strokeWidth="2" />
              <line x1="320" y1="71" x2="320" y2="64" stroke="#22c55e" strokeWidth="2" />
              <rect x="312" y="71" width="16" height="19" fill="#22c55e" opacity="0.8" />
              <line x1="320" y1="90" x2="320" y2="97" stroke="#22c55e" strokeWidth="2" />
              <line x1="360" y1="50" x2="360" y2="20" stroke="#22c55e" strokeWidth="2" />
              <rect x="352" y="50" width="16" height="20" fill="#22c55e" />
              <line x1="360" y1="70" x2="360" y2="90" stroke="#22c55e" strokeWidth="2" />
            </>
          ) : (
            <>
              <line x1="80" y1="40" x2="80" y2="33" stroke="#ef4444" strokeWidth="2" />
              <rect x="72" y="40" width="16" height="15" fill="#ef4444" opacity="0.8" />
              <line x1="80" y1="55" x2="80" y2="61" stroke="#ef4444" strokeWidth="2" />
              <line x1="120" y1="35" x2="120" y2="28" stroke="#22c55e" strokeWidth="2" />
              <rect x="112" y="35" width="16" height="20" fill="#22c55e" opacity="0.8" />
              <line x1="120" y1="55" x2="120" y2="62" stroke="#22c55e" strokeWidth="2" />
              <line x1="160" y1="38" x2="160" y2="31" stroke="#ef4444" strokeWidth="2" />
              <rect x="152" y="38" width="16" height="17" fill="#ef4444" opacity="0.8" />
              <line x1="160" y1="55" x2="160" y2="60" stroke="#ef4444" strokeWidth="2" />
              <line x1="200" y1="32" x2="200" y2="25" stroke="#22c55e" strokeWidth="2" />
              <rect x="192" y="32" width="16" height="23" fill="#22c55e" opacity="0.8" />
              <line x1="200" y1="55" x2="200" y2="60" stroke="#22c55e" strokeWidth="2" />
              <line x1="240" y1="37" x2="240" y2="30" stroke="#ef4444" strokeWidth="2" />
              <rect x="232" y="37" width="16" height="18" fill="#ef4444" opacity="0.8" />
              <line x1="240" y1="55" x2="240" y2="59" stroke="#ef4444" strokeWidth="2" />
              <line x1="280" y1="38" x2="280" y2="30" stroke="#22c55e" strokeWidth="2" />
              <rect x="272" y="38" width="16" height="17" fill="#22c55e" opacity="0.8" />
              <line x1="280" y1="55" x2="280" y2="58" stroke="#22c55e" strokeWidth="2" />
              <line x1="320" y1="41" x2="320" y2="34" stroke="#ef4444" strokeWidth="2" />
              <rect x="312" y="41" width="16" height="14" fill="#ef4444" opacity="0.8" />
              <line x1="320" y1="55" x2="320" y2="60" stroke="#ef4444" strokeWidth="2" />
              <line x1="360" y1="50" x2="360" y2="20" stroke="#ef4444" strokeWidth="2" />
              <rect x="352" y="50" width="16" height="20" fill="#ef4444" />
              <line x1="360" y1="70" x2="360" y2="90" stroke="#ef4444" strokeWidth="2" />
            </>
          )}
          <text x="10" y="55" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">{maLabel}</text>
          <text x="200" y="110" fill={above ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600" textAnchor="middle">
            {above ? `Close > ${maLabel}` : `Close < ${maLabel}`}
          </text>
        </svg>
      )
    }

    // 4. RSI
    if (ruleLower.includes('rsi') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
      const isAbove = ruleLower.includes('>')
      const rsiMatch = rule.match(/RSI\((\d+)\)/i)
      const rsiPeriod = rsiMatch ? `RSI(${rsiMatch[1]})` : 'RSI'
      const thresholdMatch = rule.match(/[><]\s*(\d+)/)
      const threshold = thresholdMatch ? parseInt(thresholdMatch[1]) : 50
      const thresholdY = 110 - threshold

      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="40" x2="400" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
          <line x1="0" y1={thresholdY} x2="400" y2={thresholdY} stroke="#f97316" strokeWidth="2" opacity="0.7" />
          {isAbove ? (
            <path d="M 0 60 Q 100 50 200 30 T 400 20" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
          ) : (
            <path d="M 0 95 Q 100 85 200 65 T 400 55" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
          )}
          <text x="5" y="38" fill="currentColor" opacity="0.5" fontSize="10">70</text>
          <text x="5" y="78" fill="currentColor" opacity="0.5" fontSize="10">30</text>
          <text x="5" y={thresholdY + 5} fill="currentColor" opacity="0.5" fontSize="10">{threshold}</text>
          <text x="200" y="115" fill={isAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600" textAnchor="middle">
            {rsiPeriod} {isAbove ? '>' : '<'} {threshold}
          </text>
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

    // 6. Volume
    if (ruleLower.includes('volume') && (ruleLower.includes('>') || ruleLower.includes('sma'))) {

      return (
        <svg viewBox="0 0 400 120" className="w-full h-36">
          <line x1="0" y1="70" x2="400" y2="70" stroke="#f97316" strokeWidth="2" opacity="0.7" />
          <rect x="60" y="72" width="20" height="23" fill="#ef4444" />
          <rect x="100" y="70" width="20" height="25" fill="#ef4444" />
          <rect x="140" y="67" width="20" height="28" fill="#ef4444" />
          <rect x="180" y="63" width="20" height="32" fill="#ef4444" />
          <rect x="220" y="50" width="20" height="45" fill="#22c55e" />
          <rect x="260" y="45" width="20" height="50" fill="#22c55e" />
          <rect x="300" y="15" width="20" height="80" fill="#22c55e" />
          <text x="10" y="65" fill="currentColor" opacity="0.5" fontSize="12" fontWeight="600">Volume SMA</text>
          <text x="200" y="112" fill="#22c55e" fontSize="12" fontWeight="600" textAnchor="middle">High Volume</text>
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
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
          <path d={isRising ? "M 0 90 Q 100 80 200 50 T 400 20" : "M 0 20 Q 100 40 200 70 T 400 100"}
                stroke={isRising ? "#22c55e" : "#ef4444"} strokeWidth="3" fill="none" />
          <text x="200" y="110" fill={isRising ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="600" textAnchor="middle">
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
