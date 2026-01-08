"use client"

import { LucideIcon } from "lucide-react"
import { cn } from "@lumiere/shared/lib/utils"

interface AccountSummaryCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  isLoading?: boolean
}

export function AccountSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  isLoading = false
}: AccountSummaryCardProps) {
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-muted-foreground"
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="h-8 w-24 bg-muted/50 animate-pulse rounded" />
        ) : (
          <div className="text-3xl font-bold text-foreground">{value}</div>
        )}

        {(subtitle || trendValue) && (
          <div className="flex items-center gap-2">
            {trendValue && trend && (
              <span className={cn("text-sm font-medium", trendColors[trend])}>
                {trend === "up" && "+"}
                {trendValue}
              </span>
            )}
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
