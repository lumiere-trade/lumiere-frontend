"use client"

import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  iconColor: string
}

export function StatsCard({ title, value, subtitle, icon: Icon, iconColor }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-card p-6 hover:border-primary/40 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary/20`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <span className="text-lg font-bold text-primary">{title}</span>
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  )
}
