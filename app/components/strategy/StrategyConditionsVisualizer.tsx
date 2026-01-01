"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { useStrategy } from "@/contexts/StrategyContext"

interface StrategyConditionsVisualizerProps {
  mode: 'entry' | 'exit' | 'both'
}

export function StrategyConditionsVisualizer({ mode = 'both' }: StrategyConditionsVisualizerProps) {
  const { editedStrategy } = useStrategy()

  if (!editedStrategy) return null

  const showEntry = mode === 'entry' || mode === 'both'
  const showExit = mode === 'exit' || mode === 'both'

  const createIndicatorDiagram = (rules: string[], logic: string, isEntry: boolean) => {
    return (
      <div className="space-y-6">
        {rules.map((rule, idx) => {
          const ruleLower = rule.toLowerCase()

          // 1. MACD Crossover
          if (ruleLower.includes('macd') && ruleLower.includes('crosses')) {
            const crossesAbove = ruleLower.includes('crosses_above')
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
                  <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="5,5" />
                  <path d="M 0 70 Q 100 72 200 70 T 400 70" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.7" />
                  <path d={crossesAbove ? "M 0 90 Q 100 80 200 50 T 400 40" : "M 0 40 Q 100 50 200 80 T 400 90"} 
                        stroke="#3b82f6" strokeWidth="3" fill="none" />
                  <circle cx="200" cy="70" r="6" fill={crossesAbove ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2" />
                  <text x="10" y="95" fill="currentColor" opacity="0.5" fontSize="12">MACD</text>
                  <text x="10" y="75" fill="currentColor" opacity="0.5" fontSize="12">Signal</text>
                  <text x="150" y={crossesAbove ? "30" : "110"} fill={crossesAbove ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">
                    {crossesAbove ? "Bullish Cross" : "Bearish Cross"}
                  </text>
                </svg>
              </div>
            )
          }

          // 2. EMA/SMA Crossover
          if ((ruleLower.includes('ema') || ruleLower.includes('sma')) && ruleLower.includes('crosses')) {
            const crossesAbove = ruleLower.includes('crosses_above')
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
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
              </div>
            )
          }

          // 3. Price vs MA
          if ((ruleLower.includes('close') || ruleLower.includes('price')) && (ruleLower.includes('ema') || ruleLower.includes('sma')) && (ruleLower.includes('>') || ruleLower.includes('<'))) {
            const above = ruleLower.includes('>')
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
                  <path d="M 0 70 Q 100 65 200 70 T 400 75" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.7" />
                  <path d={above ? "M 0 50 L 50 55 L 100 45 L 150 50 L 200 40 L 250 45 L 300 50 L 350 48 L 400 52" : 
                                  "M 0 90 L 50 85 L 100 95 L 150 90 L 200 100 L 250 95 L 300 90 L 350 92 L 400 88"}
                        stroke={above ? "#22c55e" : "#ef4444"} strokeWidth="2" fill="none" />
                  <rect x="0" y={above ? "35" : "75"} width="400" height="30" fill={above ? "#22c55e" : "#ef4444"} opacity="0.1" />
                  <text x="10" y="85" fill="currentColor" opacity="0.5" fontSize="12">MA</text>
                  <text x="10" y={above ? "45" : "105"} fill={above ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">Price</text>
                </svg>
              </div>
            )
          }

          // 4. RSI
          if (ruleLower.includes('rsi') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
            const isOverbought = ruleLower.includes('>') && (ruleLower.includes('70') || ruleLower.includes('65') || ruleLower.includes('60'))
            const isOversold = ruleLower.includes('<') && (ruleLower.includes('30') || ruleLower.includes('35') || ruleLower.includes('40'))
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
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
              </div>
            )
          }

          // 5. Bollinger Bands
          if (ruleLower.includes('bollinger')) {
            const touchesLower = ruleLower.includes('lower') || ruleLower.includes('<')
            const touchesUpper = ruleLower.includes('upper') || ruleLower.includes('>')
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
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
              </div>
            )
          }

          // 6. Volume
          if (ruleLower.includes('volume') && (ruleLower.includes('>') || ruleLower.includes('sma'))) {
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
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
              </div>
            )
          }

          // 7. Stochastic
          if (ruleLower.includes('stochastic') && (ruleLower.includes('>') || ruleLower.includes('<'))) {
            const isOverbought = ruleLower.includes('>') && (ruleLower.includes('80') || ruleLower.includes('75'))
            const isOversold = ruleLower.includes('<') && (ruleLower.includes('20') || ruleLower.includes('25'))
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
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
              </div>
            )
          }

          // 8. ADX
          if (ruleLower.includes('adx')) {
            const strongTrend = ruleLower.includes('>') && (ruleLower.includes('25') || ruleLower.includes('20'))
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
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
              </div>
            )
          }

          // 9. ATR
          if (ruleLower.includes('atr')) {
            const highVolatility = ruleLower.includes('>')
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
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
              </div>
            )
          }

          // 10. Trend (rising/falling)
          if (ruleLower.includes('rising') || ruleLower.includes('falling')) {
            const isRising = ruleLower.includes('rising')
            return (
              <div key={idx} className="bg-background/50 rounded-lg p-4">
                <div className="text-sm font-mono text-muted-foreground mb-3">{rule}</div>
                <svg viewBox="0 0 400 120" className="w-full h-24">
                  <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="5,5" />
                  <path d={isRising ? "M 0 90 Q 100 80 200 50 T 400 20" : "M 0 20 Q 100 40 200 70 T 400 100"} 
                        stroke={isRising ? "#22c55e" : "#ef4444"} strokeWidth="3" fill="none" />
                  <path d={isRising ? "M 380 25 L 400 20 L 390 35" : "M 380 95 L 400 100 L 390 85"} 
                        fill={isRising ? "#22c55e" : "#ef4444"} />
                  <text x="150" y={isRising ? "15" : "115"} fill={isRising ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">
                    {isRising ? "Rising Trend" : "Falling Trend"}
                  </text>
                </svg>
              </div>
            )
          }

          // Default
          return (
            <div key={idx} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/20 flex-shrink-0 mt-0.5">
                <span className="text-xs font-mono font-semibold text-primary">{idx}</span>
              </div>
              <code className="text-sm font-mono text-foreground">{rule}</code>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showEntry && editedStrategy.entry_rules && (
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Entry Visual Guide</h3>
              <p className="text-sm text-muted-foreground">How indicators should align for entry</p>
            </div>
          </div>
          {createIndicatorDiagram(editedStrategy.entry_rules, editedStrategy.entry_logic, true)}
          <div className="mt-4 p-3 bg-background/50 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Logic:</span>
              <code className="text-sm font-mono text-green-600">{editedStrategy.entry_logic}</code>
            </div>
          </div>
        </div>
      )}

      {showExit && editedStrategy.exit_rules && (
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Exit Visual Guide</h3>
              <p className="text-sm text-muted-foreground">How indicators trigger exit signal</p>
            </div>
          </div>
          {createIndicatorDiagram(editedStrategy.exit_rules, editedStrategy.exit_logic, false)}
          <div className="mt-4 p-3 bg-background/50 rounded-lg border border-red-500/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Logic:</span>
              <code className="text-sm font-mono text-red-600">{editedStrategy.exit_logic}</code>
            </div>
          </div>
        </div>
      )}

      <div className="bg-muted/30 border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Indicators</h3>
        <div className="flex flex-wrap gap-2">
          {editedStrategy.indicators?.map((indicator, idx) => (
            <div key={idx} className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm font-mono text-foreground">
              {indicator}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
