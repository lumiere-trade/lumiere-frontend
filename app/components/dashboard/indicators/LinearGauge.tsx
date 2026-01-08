"use client"

import { cn } from "@lumiere/shared/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface LinearGaugeProps {
  value: number
  currentPrice: number
  label: string
  format?: "price" | "percent" | "number"
  className?: string
}

/**
 * Linear indicator display for price-based indicators (EMA, SMA, Bollinger)
 * Shows value relative to current price with trend direction
 */
export function LinearGauge({
  value,
  currentPrice,
  label,
  format = "price",
  className,
}: LinearGaugeProps) {
  // Calculate difference from current price
  const diff = value - currentPrice
  const diffPercent = currentPrice > 0 ? (diff / currentPrice) * 100 : 0
  
  // Determine trend
  const trend = Math.abs(diffPercent) < 0.1 ? "neutral" : diff > 0 ? "above" : "below"
  
  const trendConfig = {
    above: { 
      icon: TrendingUp, 
      color: "text-green-500", 
      bg: "bg-green-500/10",
      label: "above price" 
    },
    below: { 
      icon: TrendingDown, 
      color: "text-red-500", 
      bg: "bg-red-500/10",
      label: "below price" 
    },
    neutral: { 
      icon: Minus, 
      color: "text-muted-foreground", 
      bg: "bg-muted/30",
      label: "at price" 
    },
  }
  
  const config = trendConfig[trend]
  const Icon = config.icon
  
  // Format value based on type
  const formatValue = () => {
    switch (format) {
      case "price":
        return `$${value.toFixed(2)}`
      case "percent":
        return `${value.toFixed(2)}%`
      default:
        return value.toFixed(2)
    }
  }
  
  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg",
      config.bg,
      className
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-medium", config.color)}>
          {formatValue()}
        </span>
        <span className="text-xs text-muted-foreground">
          ({diffPercent >= 0 ? "+" : ""}{diffPercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  )
}
