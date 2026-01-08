"use client"

import { Wallet, TrendingUp, TrendingDown, Target } from "lucide-react"
import { AccountSummaryCard } from "./AccountSummaryCard"

interface AccountSummaryProps {
  equity: number
  initialCapital: number
  todayPnL: number
  openPnL: number
  isInPosition: boolean
  isLoading?: boolean
}

export function AccountSummary({
  equity,
  initialCapital,
  todayPnL,
  openPnL,
  isInPosition,
  isLoading = false
}: AccountSummaryProps) {
  const totalPnL = equity - initialCapital
  const totalPnLPct = ((totalPnL / initialCapital) * 100)
  const todayPnLPct = ((todayPnL / initialCapital) * 100)

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value)
    return `$${absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AccountSummaryCard
        title="Total Equity"
        value={formatCurrency(equity)}
        subtitle={`Initial: ${formatCurrency(initialCapital)}`}
        icon={Wallet}
        trend={totalPnL >= 0 ? "up" : "down"}
        trendValue={formatPercent(totalPnLPct)}
        isLoading={isLoading}
      />

      <AccountSummaryCard
        title="Today's P&L"
        value={`${todayPnL >= 0 ? '+' : '-'}${formatCurrency(todayPnL)}`}
        icon={todayPnL >= 0 ? TrendingUp : TrendingDown}
        trend={todayPnL >= 0 ? "up" : todayPnL < 0 ? "down" : "neutral"}
        trendValue={formatPercent(todayPnLPct)}
        isLoading={isLoading}
      />

      <AccountSummaryCard
        title="Open P&L"
        value={`${openPnL >= 0 ? '+' : '-'}${formatCurrency(openPnL)}`}
        subtitle="Unrealized"
        icon={Target}
        trend={openPnL >= 0 ? "up" : openPnL < 0 ? "down" : "neutral"}
        isLoading={isLoading}
      />

      <AccountSummaryCard
        title="Position"
        value={isInPosition ? "IN POSITION" : "FLAT"}
        subtitle={isInPosition ? "Active trade" : "No open trades"}
        icon={Target}
        trend={isInPosition ? "up" : "neutral"}
        isLoading={isLoading}
      />
    </div>
  )
}
