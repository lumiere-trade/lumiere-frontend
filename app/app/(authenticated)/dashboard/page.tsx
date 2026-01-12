"use client"

import { Suspense, useEffect, useState } from "react"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { LiveDashboard, NoActiveStrategy } from "@/components/dashboard/live"
import { LiveDashboardProvider, buildStrategyConfig } from "@/contexts/LiveDashboardContext"
import { useActiveDeployments } from "@/hooks/queries/use-chevalier-queries"
import { useStrategies } from "@/hooks/use-strategies"
import { useAuth } from "@/hooks/use-auth"
import {
  usePauseDeployment,
  useResumeDeployment,
  useStopDeployment
} from "@/hooks/mutations/use-chevalier-mutations"
import { Spinner } from "@/components/ui/spinner"
import * as tsdlApi from "@/lib/api/tsdl"

function DashboardContent() {
  const { user } = useAuth()
  const { strategies, isLoading: isLoadingStrategies } = useStrategies()
  const {
    data: activeDeployments,
    isLoading: isLoadingDeployments
  } = useActiveDeployments(user?.id)

  const pauseMutation = usePauseDeployment()
  const resumeMutation = useResumeDeployment()
  const stopMutation = useStopDeployment()

  // State for TSDL validation
  const [validatedData, setValidatedData] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  const isLoading = isLoadingStrategies || isLoadingDeployments
  const hasStrategies = !isLoadingStrategies && strategies && strategies.length > 0

  const activeDeployment = activeDeployments && activeDeployments.length > 0
    ? activeDeployments[0]
    : null

  const activeStrategy = activeDeployment && strategies
    ? strategies.find(s => s.id === activeDeployment.architect_strategy_id)
    : null

  // Extract and validate TSDL data when active strategy changes
  useEffect(() => {
    if (!activeStrategy?.tsdl_code) {
      setValidatedData(null)
      return
    }

    let cancelled = false
    setIsValidating(true)

    async function validateTsdl() {
      try {
        const tsdlJson = tsdlApi.parseTSDLCode(activeStrategy.tsdl_code)
        const validated = await tsdlApi.extractAll(tsdlJson)
        
        if (!cancelled) {
          setValidatedData(validated)
          console.log('[Dashboard] TSDL validated:', validated)
        }
      } catch (error) {
        console.error('[Dashboard] TSDL validation failed:', error)
        if (!cancelled) {
          setValidatedData(null)
        }
      } finally {
        if (!cancelled) {
          setIsValidating(false)
        }
      }
    }

    validateTsdl()

    return () => {
      cancelled = true
    }
  }, [activeStrategy?.tsdl_code, activeStrategy?.id])

  if (isLoading || isValidating) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  // CASE 1: Has active deployment - show Live Dashboard with WebSocket
  if (activeDeployment && activeStrategy && validatedData && user) {
    // Build strategy config from TSDL-validated data
    const config = buildStrategyConfig(
      activeDeployment.deployment_id,
      activeStrategy.id,
      validatedData.name,
      {
        symbol: validatedData.symbol,
        timeframe: validatedData.timeframe,
        indicators: validatedData.indicators
      }
    )

    return (
      <LiveDashboardProvider
        userId={user.id}
        config={config}
        initialCapital={activeDeployment.current_capital || 10000}
      >
        <LiveDashboard
          deployment={activeDeployment}
          strategyName={validatedData.name}
          strategyJson={validatedData}
          onPause={() => pauseMutation.mutate(activeDeployment.deployment_id)}
          onResume={() => resumeMutation.mutate(activeDeployment.deployment_id)}
          onStop={() => stopMutation.mutate(activeDeployment.deployment_id)}
          isPausing={pauseMutation.isPending}
          isResuming={resumeMutation.isPending}
          isStopping={stopMutation.isPending}
        />
      </LiveDashboardProvider>
    )
  }

  // CASE 2: Has strategies but none deployed
  if (hasStrategies) {
    return (
      <div className="container mx-auto px-6 py-8">
        <DashboardStats />
        <NoActiveStrategy hasStrategies={true} />
        <div className="mt-8">
          <RecentActivity />
        </div>
      </div>
    )
  }

  // CASE 3: No strategies at all
  return (
    <div className="container mx-auto px-6 py-8">
      <DashboardStats />
      <EmptyState />
      <div className="mt-8">
        <RecentActivity />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
