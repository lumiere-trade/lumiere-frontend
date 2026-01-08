"use client"

import { Suspense } from "react"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { LiveDashboard, NoActiveStrategy } from "@/components/dashboard/live"
import { LiveDashboardProvider, parseStrategyConfig } from "@/contexts/LiveDashboardContext"
import { useActiveDeployments } from "@/hooks/queries/use-chevalier-queries"
import { useStrategies } from "@/hooks/use-strategies"
import { useAuth } from "@/hooks/use-auth"
import {
  usePauseDeployment,
  useResumeDeployment,
  useStopDeployment
} from "@/hooks/mutations/use-chevalier-mutations"
import { Spinner } from "@/components/ui/spinner"

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

  const isLoading = isLoadingStrategies || isLoadingDeployments
  const hasStrategies = !isLoadingStrategies && strategies && strategies.length > 0

  const activeDeployment = activeDeployments && activeDeployments.length > 0
    ? activeDeployments[0]
    : null

  const activeStrategy = activeDeployment && strategies
    ? strategies.find(s => s.id === activeDeployment.architect_strategy_id)
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  // CASE 1: Has active deployment - show Live Dashboard with WebSocket
  if (activeDeployment && activeStrategy && user) {
    const strategyJson = JSON.parse(activeStrategy.tsdl_code || '{}')
    
    // Parse strategy config for WebSocket context
    const config = parseStrategyConfig(
      activeDeployment.deployment_id,
      activeStrategy.id,
      activeStrategy.name,
      activeStrategy.tsdl_code || '{}'
    )

    return (
      <LiveDashboardProvider
        userId={user.id}
        config={config}
        initialCapital={activeDeployment.current_capital || 10000}
      >
        <LiveDashboard
          deployment={activeDeployment}
          strategyName={activeStrategy.name}
          strategyJson={strategyJson}
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
