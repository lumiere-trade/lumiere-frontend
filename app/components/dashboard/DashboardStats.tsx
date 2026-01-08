"use client"

import { Wallet, BarChart3, TrendingUp } from "lucide-react"
import { StatsCard } from "./StatsCard"
import { useEscrow } from "@/hooks/use-escrow"
import { useStrategies } from "@/hooks/use-strategies"

export function DashboardStats() {
  const { escrowBalance, isLoading: isLoadingEscrow } = useEscrow()
  const { strategies, isLoading: isLoadingStrategies } = useStrategies()

  const escrowBalanceNum = parseFloat(escrowBalance)
  const formattedBalance = isLoadingEscrow ? "..." : `$${escrowBalanceNum.toFixed(2)}`

  const strategyCount = isLoadingStrategies ? "..." : strategies.length
  const strategySubtitle = isLoadingStrategies
    ? "Loading..."
    : strategies.length === 0
      ? "Deploy your first"
      : strategies.length === 1
        ? "1 strategy created"
        : `${strategies.length} strategies created`

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      <StatsCard
        title="Escrow Balance"
        value={formattedBalance}
        subtitle="Available to trade"
        icon={Wallet}
        iconColor="text-primary"
      />
      <StatsCard
        title="Strategies"
        value={strategyCount}
        subtitle={strategySubtitle}
        icon={BarChart3}
        iconColor="text-primary"
      />
      <StatsCard
        title="Total P&L"
        value="$0.00"
        subtitle="No activity yet"
        icon={TrendingUp}
        iconColor="text-primary"
      />
    </div>
  )
}
