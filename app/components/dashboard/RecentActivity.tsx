"use client"

import { ArrowDownToLine } from "lucide-react"
import { useEscrowTransactionsQuery } from "@/hooks/queries/use-escrow-queries"

export function RecentActivity() {
  const { data: transactionsData, isLoading } = useEscrowTransactionsQuery()

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg border border-primary/20 bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <ArrowDownToLine className="h-4 w-4 text-primary" />
            </div>
            Recent Deposits
          </h3>
          <div className="text-center py-6 text-muted-foreground text-sm">
            Loading...
          </div>
        </div>
      </div>
    )
  }

  const transactions = transactionsData?.transactions || []
  const deposits = transactions.filter(tx => tx.type === 'deposit').slice(0, 3)

  if (deposits.length === 0) {
    return null
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-lg border border-primary/20 bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <ArrowDownToLine className="h-4 w-4 text-primary" />
          </div>
          Recent Deposits
        </h3>
        
        <div className="space-y-3">
          {deposits.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-background hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <ArrowDownToLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Deposit</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(tx.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary">
                  +{tx.amount.toFixed(2)} USDC
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
