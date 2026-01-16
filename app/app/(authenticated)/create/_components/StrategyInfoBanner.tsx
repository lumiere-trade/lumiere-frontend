"use client"

import { TrendingUp } from "lucide-react"
import type { Strategy } from "@/contexts/StrategyContext"

interface StrategyInfoBannerProps {
  strategy: Strategy
  onViewDetails: () => void
}

export function StrategyInfoBanner({ strategy }: StrategyInfoBannerProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12">
      <div className="text-center space-y-4">
        {/* Strategy Icon & Name */}
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            {strategy.name}
          </h1>
        </div>

        {/* Description */}
        {strategy.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {strategy.description}
          </p>
        )}

        {/* Hint */}
        <p className="text-sm text-muted-foreground pt-4">
          Ask Prophet AI to modify this strategy or start a new conversation below.
        </p>
      </div>
    </div>
  )
}
