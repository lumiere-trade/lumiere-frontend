"use client"

import { Button } from '@lumiere/shared/components/ui/button'
import { Play, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface NoActiveStrategyProps {
  hasStrategies: boolean
}

export function NoActiveStrategy({ hasStrategies }: NoActiveStrategyProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-primary/20 p-12 max-w-2xl w-full text-center">
        <div className="relative">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
              <Play className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4">
            No Active Strategy
          </h2>

          <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
            {hasStrategies
              ? "Deploy one of your strategies to start live trading"
              : "Create and deploy a strategy to start live trading"
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {hasStrategies ? (
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold"
                onClick={() => router.push('/dashboard?tab=all')}
              >
                VIEW STRATEGIES
              </Button>
            ) : (
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold"
                onClick={() => router.push('/create')}
              >
                CREATE STRATEGY
              </Button>
            )}
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Learn about live trading
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
