"use client"

import { Button } from '@lumiere/shared/components/ui/button'
import { Sparkles, ExternalLink } from "lucide-react"
import Link from "next/link"

export function EmptyState() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-primary/20 p-12 max-w-2xl w-full text-center">
        <div className="relative">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4">
            Create Your First Strategy
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Turn your trading ideas into automated strategies powered by AI
          </p>

          <Link href="/create">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-semibold mb-6"
            >
              CREATE STRATEGY
            </Button>
          </Link>

          <div>
            
              <a href="#"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Learn about strategy types
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
