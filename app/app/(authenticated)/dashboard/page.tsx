"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { StrategyList } from "@/components/strategy/StrategyList"
import { useStrategies } from "@/hooks/use-strategies"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lumiere/shared/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"

function DashboardContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  const highlightId = searchParams.get('highlight')

  const { strategies, isLoading } = useStrategies()

  // Auto-scroll to highlighted strategy
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        const element = document.querySelector(`[data-strategy-id="${highlightId}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [highlightId])

  const hasStrategies = !isLoading && strategies && strategies.length > 0

  return (
    <div className="container mx-auto px-6 py-8">
      <DashboardStats />

      {!hasStrategies && <EmptyState />}

      {hasStrategies && (
        <div className="mb-8">
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Strategies</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <StrategyList filter="all" highlightedStrategyId={highlightId} />
            </TabsContent>

            <TabsContent value="active">
              <StrategyList filter="active" highlightedStrategyId={highlightId} />
            </TabsContent>

            <TabsContent value="inactive">
              <StrategyList filter="inactive" highlightedStrategyId={highlightId} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <RecentActivity />
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
