"use client"

import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import type { EscrowTransactionDto } from "@/types/api.types"

interface TransactionListProps {
  transactions: EscrowTransactionDto[]
  isLoading: boolean
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <TransactionItem key={tx.id} transaction={tx} />
      ))}
    </div>
  )
}

interface TransactionItemProps {
  transaction: EscrowTransactionDto
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const isDeposit = transaction.transaction_type === 'deposit'
  const isWithdraw = transaction.transaction_type === 'withdraw'
  const isInitialize = transaction.transaction_type === 'initialize'
  
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine
  const amountColor = isDeposit ? 'text-green-500' : 'text-red-500'
  const amountPrefix = isDeposit ? '+' : '-'
  
  const statusColor = {
    pending: 'text-yellow-500',
    confirmed: 'text-green-500',
    failed: 'text-red-500',
  }[transaction.status]

  const typeLabel = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    initialize: 'Initialize Escrow',
    subscription_fee: 'Subscription Fee',
  }[transaction.transaction_type]

  const date = new Date(transaction.created_at)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card p-4 hover:bg-accent/50 transition-colors">
      <div className={'flex h-10 w-10 items-center justify-center rounded-full ' + (isDeposit ? 'bg-green-500/20' : 'bg-red-500/20')}>
        <Icon className={'h-5 w-5 ' + (isDeposit ? 'text-green-500' : 'text-red-500')} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold truncate">{typeLabel}</p>
          {!isInitialize && (
            <p className={'font-semibold whitespace-nowrap ' + amountColor}>
              {amountPrefix}{parseFloat(transaction.amount).toFixed(2)} {transaction.token_mint}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span>{formattedDate} at {formattedTime}</span>
          <span>•</span>
          <span className={'capitalize ' + statusColor}>{transaction.status}</span>
        </div>
        
        
          <a href={'https://solscan.io/tx/' + transaction.tx_signature}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-1 inline-block truncate max-w-full"
          title={transaction.tx_signature}
        >
          {transaction.tx_signature.slice(0, 8)}...{transaction.tx_signature.slice(-8)}
        </a>
      </div>
    </div>
  )
}
