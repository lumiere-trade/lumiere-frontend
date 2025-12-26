"use client"
import { memo } from "react"
import { Badge } from "@lumiere/shared/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Target,
  StopCircle,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react"

interface TradeReasonBadgeProps {
  reason: string
  side?: "BUY" | "SELL"
  compact?: boolean
}

interface ReasonStyle {
  icon: React.ReactNode
  variant: "default" | "destructive" | "success" | "warning" | "secondary"
  label?: string
}

export const TradeReasonBadge = memo(function TradeReasonBadge({
  reason,
  side,
  compact = false
}: TradeReasonBadgeProps) {
  const getReasonStyle = (reason: string, side?: string): ReasonStyle => {
    const lowerReason = reason.toLowerCase()

    // Stop Loss - Red
    if (lowerReason.includes('stop loss')) {
      return {
        icon: <StopCircle className="h-4 w-4" />,
        variant: "destructive",
        label: "Stop Loss"
      }
    }

    // Take Profit - Green
    if (lowerReason.includes('take profit')) {
      return {
        icon: <Target className="h-4 w-4" />,
        variant: "success",
        label: "Take Profit"
      }
    }

    // Crossover Entry - Blue (BUY)
    if (lowerReason.includes('crosses above') || lowerReason.includes('crosses_above')) {
      return {
        icon: <ArrowUpCircle className="h-4 w-4" />,
        variant: "default",
        label: "Entry Signal"
      }
    }

    // Crossover Exit - Orange (SELL)
    if (lowerReason.includes('crosses below') || lowerReason.includes('crosses_below')) {
      return {
        icon: <ArrowDownCircle className="h-4 w-4" />,
        variant: "warning",
        label: "Exit Signal"
      }
    }

    // Rising/Falling indicators
    if (lowerReason.includes('rising')) {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        variant: "default",
        label: "Rising"
      }
    }

    if (lowerReason.includes('falling')) {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        variant: "warning",
        label: "Falling"
      }
    }

    // Generic entry/exit
    if (side === 'BUY') {
      return {
        icon: <Activity className="h-4 w-4" />,
        variant: "default",
        label: "Entry"
      }
    }

    if (side === 'SELL') {
      return {
        icon: <Activity className="h-4 w-4" />,
        variant: "secondary",
        label: "Exit"
      }
    }

    // Fallback
    return {
      icon: <Activity className="h-4 w-4" />,
      variant: "secondary",
      label: "Signal"
    }
  }

  const style = getReasonStyle(reason, side)

  if (compact) {
    return (
      <Badge
        variant={style.variant}
        className="gap-2 text-sm font-medium px-3 py-1.5"
      >
        {style.icon}
        {style.label}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={style.variant}
        className="gap-2.5 text-base font-medium px-4 py-2 min-w-fit"
      >
        {style.icon}
        <span className="whitespace-nowrap">{reason}</span>
      </Badge>
    </div>
  )
})
