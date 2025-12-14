"use client"

import { useEffect, useRef, useState } from "react"
import { Progress } from "@/components/ui/progress"

interface StrategyGenerationProgressProps {
  progress: number
  stage: string
  message: string
}

/**
 * Smart Progress Bar with smooth interpolation
 *
 * Flow:
 * - Prophet sends: 30% → Fast jump to 30%, slow fill to 60%
 * - Prophet sends: 60% → Fast jump to 60%, slow fill to 90%
 * - Prophet sends: 90% → Fast jump to 90%, slow fill to 95%
 * - Holds at milestone if no new event
 */
export function StrategyGenerationProgress({
  progress,
  stage,
  message
}: StrategyGenerationProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const targetProgressRef = useRef(0)
  const currentProgressRef = useRef(0)
  const lastUpdateTimeRef = useRef<number>(0)

  // Progress milestones for slow fill targets
  const getNextMilestone = (current: number): number => {
    if (current < 30) return 60
    if (current < 60) return 90
    if (current < 90) return 95
    return 95 // Hold at 95 until strategy_generated
  }

  useEffect(() => {
    targetProgressRef.current = progress

    // When new progress event arrives from Prophet
    if (progress > currentProgressRef.current) {
      // Fast jump to target (will complete in ~200ms)
      currentProgressRef.current = progress
      lastUpdateTimeRef.current = performance.now()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [progress])

  useEffect(() => {
    const animate = (timestamp: number) => {
      const elapsed = timestamp - lastUpdateTimeRef.current

      // Fast phase: Jump to target in 200ms
      if (currentProgressRef.current < targetProgressRef.current) {
        const fastSpeed = (targetProgressRef.current - currentProgressRef.current) / 0.2 // per second
        const increment = (fastSpeed * elapsed) / 1000

        currentProgressRef.current = Math.min(
          currentProgressRef.current + increment,
          targetProgressRef.current
        )

        setDisplayProgress(Math.round(currentProgressRef.current))
        lastUpdateTimeRef.current = timestamp
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Slow phase: Creep toward next milestone
      const nextMilestone = getNextMilestone(targetProgressRef.current)

      if (currentProgressRef.current < nextMilestone) {
        // Slow fill: ~10% per second
        const slowSpeed = 10 // percent per second
        const increment = (slowSpeed * elapsed) / 1000

        currentProgressRef.current = Math.min(
          currentProgressRef.current + increment,
          nextMilestone
        )

        setDisplayProgress(Math.round(currentProgressRef.current))
        lastUpdateTimeRef.current = timestamp
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Reached milestone - hold until next Prophet event
        setDisplayProgress(Math.round(currentProgressRef.current))
        animationFrameRef.current = null
      }
    }

    lastUpdateTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [progress])

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-1 max-w-[80%]">
        <div className="rounded-2xl px-4 py-3 bg-card border border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-foreground">
                {message || 'Generating strategy...'}
              </p>
              <p className="text-sm text-muted-foreground font-mono">
                {displayProgress}%
              </p>
            </div>

            <Progress value={displayProgress} className="h-2" />

            <p className="text-xs text-muted-foreground">
              {stage === 'generating_strategy' && 'Analyzing indicators and conditions'}
              {stage === 'validating_strategy' && 'Validating TSDL syntax and parameters'}
              {stage === 'wrapping_up' && 'Preparing strategy interface'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
