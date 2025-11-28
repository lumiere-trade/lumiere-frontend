"use client"

import { Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface StrategyGenerationProgressProps {
  progress: number
}

export function StrategyGenerationProgress({ progress }: StrategyGenerationProgressProps) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0 self-start mt-1">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
      </div>
      
      <div className="flex-1 max-w-[80%]">
        <div className="rounded-2xl px-4 py-3 bg-background border border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-foreground">
                Generating strategy...
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <p className="text-sm text-muted-foreground">
              Analyzing indicators and risk parameters
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
