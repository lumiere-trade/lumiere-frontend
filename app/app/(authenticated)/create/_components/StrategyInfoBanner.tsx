"use client"

import { FileText, TrendingUp } from "lucide-react"
import type { Strategy } from "@/contexts/StrategyContext"

interface StrategyInfoBannerProps {
  strategy: Strategy
  onViewDetails: () => void
}

export function StrategyInfoBanner({ strategy, onViewDetails }: StrategyInfoBannerProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-8">
      <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
        {/* Strategy Name */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {strategy.name}
              </h2>
            </div>
            
            {/* Description */}
            {strategy.description && (
              <p className="text-base text-muted-foreground leading-relaxed">
                {strategy.description}
              </p>
            )}
          </div>

          {/* View Details Button */}
          <button
            onClick={onViewDetails}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap text-sm font-medium"
          >
            <FileText className="h-4 w-4" />
            View Details
          </button>
        </div>

        {/* Start Conversation Hint */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Ask Prophet AI to modify this strategy or start a new conversation below.
          </p>
        </div>
      </div>
    </div>
  )
}
