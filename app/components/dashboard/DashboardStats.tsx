"use client"

import { Wallet, BarChart3, TrendingUp } from "lucide-react"
import { StatsCard } from "./StatsCard"
import { useEscrow } from "@/hooks/use-escrow"

export function DashboardStats() {
  const { escrowBalance, isLoading } = useEscrow()
  
  const escrowBalanceNum = parseFloat(escrowBalance)
  const formattedBalance = isLoading ? "..." : `$${escrowBalanceNum.toFixed(2)}`

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
        value={0}
        subtitle="Deploy your first"
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
