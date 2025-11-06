"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NavigationHeader } from "@/components/navigation/NavigationHeader"
import { StrategyPanel } from "@/components/strategy/StrategyPanel"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { storage } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { logger, LogCategory } from "@/lib/debug"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    logger.info(LogCategory.AUTH, 'Dashboard page mounted, checking JWT...')

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
      <NavigationHeader currentPage="dashboard" isSidebarOpen={isSidebarOpen} />
      
      <StrategyPanel isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main 
        className="pt-[73px] transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? '300px' : '32px',
          width: isSidebarOpen ? 'calc(100vw - 300px)' : 'calc(100vw - 32px)'
        }}
      >
        <div className="container mx-auto px-6 py-8">
          <DashboardStats />
          <EmptyState />
          <RecentActivity />
        </div>
      </main>
    </div>
  )
}
