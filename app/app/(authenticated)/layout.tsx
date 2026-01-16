"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { NavigationHeader } from "@/components/navigation/NavigationHeader"
import { StrategyPanel } from "@/components/strategy/StrategyPanel"
import { StrategyDetailsPanel } from "@/components/strategy/StrategyDetailsPanel"
import { StrategyProvider, useStrategy } from "@/contexts/StrategyContext"
import { storage } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useIsLargeScreen } from "@/hooks/use-media-query"
import { logger, LogCategory } from "@/lib/debug"

function AuthenticatedLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const strategyContext = useStrategy()
  const isLargeScreen = useIsLargeScreen()

  const currentPage = pathname?.includes('/create') ? 'create' : 'dashboard'
  const isCreatePage = pathname === '/create'

  // Details panel is ALWAYS open on /create page
  const isDetailsPanelOpen = isCreatePage

  useEffect(() => {
    logger.info(LogCategory.AUTH, 'Authenticated layout mounted, checking JWT...')

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

  // Auto-close StrategyPanel when on create page (small screens only)
  useEffect(() => {
    // Skip auto-close on large screens
    if (isLargeScreen) return

    // On small screens, close sidebar when on create page (details panel takes priority)
    if (isCreatePage && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [isCreatePage, isLargeScreen])

  if (!storage.hasToken() || isLoading) {
    return null
  }

  // RESPONSIVE PADDING CALCULATION
  let leftPadding: string
  let rightPadding: string

  if (isLargeScreen) {
    // Large screen (≥1920px): Support 3-panel layout
    leftPadding = isSidebarOpen ? '300px' : '32px'
    // Details panel always open on /create page
    rightPadding = isCreatePage ? 'calc(50% + 32px)' : '32px'
  } else {
    // Small/Medium screen (≤1919px): Max 2 panels
    // On create page, details panel takes priority
    leftPadding = isSidebarOpen && !isCreatePage ? '300px' : '32px'
    rightPadding = isCreatePage ? 'calc(50% + 32px)' : '32px'
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed at top */}
      <NavigationHeader currentPage={currentPage} />

      {/* Sidebar - Fixed positioning */}
      <StrategyPanel
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area - no transitions */}
      <main
        className="flex-1 overflow-y-auto bg-background"
        style={{
          paddingLeft: leftPadding,
          paddingRight: rightPadding,
        }}
      >
        {children}
      </main>

      {/* Details Panel - Always visible on /create page */}
      {isCreatePage && (
        <StrategyDetailsPanel
          activeTab={strategyContext.detailsPanelTab}
          onTabChange={strategyContext.setDetailsPanelTab}
        />
      )}
    </div>
  )
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StrategyProvider>
      <AuthenticatedLayoutContent>
        {children}
      </AuthenticatedLayoutContent>
    </StrategyProvider>
  )
}
