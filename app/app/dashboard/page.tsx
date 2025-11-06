"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavigationHeader } from '@/components/navigation/NavigationHeader'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { storage } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { logger, LogCategory } from "@/lib/debug"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    logger.info(LogCategory.AUTH, 'Dashboard mounted, checking JWT...')

    if (!storage.hasToken()) {
      logger.warn(LogCategory.AUTH, 'No JWT found, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isLoading && !user) {
      logger.warn(LogCategory.AUTH, 'JWT invalid, redirecting to login')
      router.replace('/login')
    }
  }, [router, user, isLoading])

  if (!storage.hasToken() || isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader currentPage="dashboard" />

      <div className="container mx-auto px-6 py-12">
        <DashboardStats />
        <EmptyState />
        <div className="mt-16">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
