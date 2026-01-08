"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { Activity } from "lucide-react"
import { ArcGauge } from "./ArcGauge"
import { LinearGauge } from "./LinearGauge"
import { cn } from "@lumiere/shared/lib/utils"

interface IndicatorPanelProps {
  indicators: Record<string, number>
  currentPrice: number
  isLoading?: boolean
  className?: string
}

// Indicator metadata for display configuration
const INDICATOR_CONFIG: Record<string, {
  type: "oscillator" | "price" | "volatility"
  label: string
  min?: number
  max?: number
  zones?: { low: number; high: number }
}> = {
  // Oscillators (0-100 range)
  rsi_14: { type: "oscillator", label: "RSI(14)", zones: { low: 30, high: 70 } },
  rsi_16: { type: "oscillator", label: "RSI(16)", zones: { low: 30, high: 70 } },
  rsi_21: { type: "oscillator", label: "RSI(21)", zones: { low: 30, high: 70 } },
  adx_14: { type: "oscillator", label: "ADX(14)", zones: { low: 20, high: 50 } },
  stochastic_k: { type: "oscillator", label: "Stoch %K", zones: { low: 20, high: 80 } },
  stochastic_d: { type: "oscillator", label: "Stoch %D", zones: { low: 20, high: 80 } },
  
  // Price-based indicators
  ema_20: { type: "price", label: "EMA(20)" },
  ema_50: { type: "price", label: "EMA(50)" },
  sma_20: { type: "price", label: "SMA(20)" },
  sma_50: { type: "price", label: "SMA(50)" },
  bollinger_upper: { type: "price", label: "BB Upper" },
  bollinger_lower: { type: "price", label: "BB Lower" },
  
  // Volatility indicators
  atr_14: { type: "volatility", label: "ATR(14)" },
  macd: { type: "volatility", label: "MACD" },
}

/**
 * Panel displaying all active indicators with appropriate visualizations
 */
export function IndicatorPanel({
  indicators,
  currentPrice,
  isLoading = false,
  className,
}: IndicatorPanelProps) {
  // Separate indicators by type
  const oscillators: Array<{ key: string; value: number; config: typeof INDICATOR_CONFIG[string] }> = []
  const priceIndicators: Array<{ key: string; value: number; config: typeof INDICATOR_CONFIG[string] }> = []
  const otherIndicators: Array<{ key: string; value: number; config: typeof INDICATOR_CONFIG[string] }> = []
  
  Object.entries(indicators).forEach(([key, value]) => {
    const config = INDICATOR_CONFIG[key]
    if (!config) {
      // Unknown indicator - show as other
      otherIndicators.push({ key, value, config: { type: "volatility", label: key.toUpperCase() } })
      return
    }
    
    if (config.type === "oscillator") {
      oscillators.push({ key, value, config })
    } else if (config.type === "price") {
      priceIndicators.push({ key, value, config })
    } else {
      otherIndicators.push({ key, value, config })
    }
  })
  
  const hasIndicators = Object.keys(indicators).length > 0
  
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-pulse text-muted-foreground">
              Loading indicators...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!hasIndicators) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Waiting for indicator data...
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Indicators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Oscillators - Arc Gauges */}
        {oscillators.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {oscillators.map(({ key, value, config }) => (
              <ArcGauge
                key={key}
                value={value}
                label={config.label}
                zones={config.zones}
                size="md"
              />
            ))}
          </div>
        )}
        
        {/* Price-based indicators - Linear Gauges */}
        {priceIndicators.length > 0 && (
          <div className="space-y-2">
            {priceIndicators.map(({ key, value, config }) => (
              <LinearGauge
                key={key}
                value={value}
                currentPrice={currentPrice}
                label={config.label}
                format="price"
              />
            ))}
          </div>
        )}
        
        {/* Other indicators - Simple display */}
        {otherIndicators.length > 0 && (
          <div className="space-y-2">
            {otherIndicators.map(({ key, value, config }) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <span className="text-sm text-muted-foreground">{config.label}</span>
                <span className="text-sm font-medium">{value.toFixed(4)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
