"use client"

import { Suspense, useEffect } from "react"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { LiveDashboard, NoActiveStrategy } from "@/components/dashboard/live"
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

  // DEBUG LOGGING
  useEffect(() => {
    console.log('[DASHBOARD DEBUG] ======================')
    console.log('[DASHBOARD DEBUG] user:', user?.id)
    console.log('[DASHBOARD DEBUG] isLoadingStrategies:', isLoadingStrategies)
    console.log('[DASHBOARD DEBUG] isLoadingDeployments:', isLoadingDeployments)
    console.log('[DASHBOARD DEBUG] strategies:', strategies)
    console.log('[DASHBOARD DEBUG] strategies.length:', strategies?.length)
    console.log('[DASHBOARD DEBUG] hasStrategies:', hasStrategies)
    console.log('[DASHBOARD DEBUG] activeDeployments:', activeDeployments)
    console.log('[DASHBOARD DEBUG] activeDeployment:', activeDeployment)
    console.log('[DASHBOARD DEBUG] activeStrategy:', activeStrategy)
    console.log('[DASHBOARD DEBUG] ======================')
  }, [user, isLoadingStrategies, isLoadingDeployments, strategies, hasStrategies, activeDeployments, activeDeployment, activeStrategy])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  // CASE 1: Has active deployment - show Live Dashboard
  if (activeDeployment && activeStrategy) {
    console.log('[DASHBOARD] Rendering LiveDashboard')
    const strategyJson = JSON.parse(activeStrategy.tsdl_code || '{}')

    return (
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
    )
  }

  // CASE 2: Has strategies but none deployed
  if (hasStrategies) {
    console.log('[DASHBOARD] Rendering NoActiveStrategy (has strategies)')
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
  console.log('[DASHBOARD] Rendering EmptyState (no strategies)')
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
