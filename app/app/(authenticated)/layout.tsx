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
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)

  const strategyContext = useStrategy()
  const isLargeScreen = useIsLargeScreen()

  const currentPage = pathname?.includes('/create') ? 'create' : 'dashboard'
  const isCreatePage = pathname === '/create'

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

  // Sync isDetailsPanelOpen with StrategyContext
  useEffect(() => {
    setIsDetailsPanelOpen(strategyContext.isDetailsPanelOpen)
  }, [strategyContext.isDetailsPanelOpen])

  // RESPONSIVE AUTO-CLOSE LOGIC
  // Small/Medium screens (≤1919px): MAX 2 panels - auto-close behavior
  // Large screens (≥1920px): Allow 3 panels - no auto-close

  // Auto-close StrategyPanel when DetailsPanel opens (small screens only)
  useEffect(() => {
    // Skip auto-close on large screens
    if (isLargeScreen) return

    if (isDetailsPanelOpen && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [isDetailsPanelOpen, isLargeScreen])

  // Auto-close DetailsPanel when StrategyPanel opens (small screens only, unless fullscreen)
  useEffect(() => {
    // Skip auto-close on large screens
    if (isLargeScreen) return

    if (isSidebarOpen && isDetailsPanelOpen && !strategyContext.isParametersFullscreen) {
      strategyContext.closeDetailsPanel()
    }
  }, [isSidebarOpen, isLargeScreen, strategyContext.isParametersFullscreen])

  if (!storage.hasToken() || isLoading) {
    return null
  }

  const handleDetailsPanelToggle = () => {
    if (isDetailsPanelOpen) {
      strategyContext.closeDetailsPanel()
    } else {
      strategyContext.openDetailsPanel()
    }
  }

  const handleOpenStrategies = () => {
    setIsSidebarOpen(true)
  }

  const handleOpenChat = () => {
    // Collapse fullscreen to restore normal layout where chat is visible
    if (strategyContext.isParametersFullscreen) {
      strategyContext.collapseParametersFullscreen()
    }
  }

  // RESPONSIVE PADDING CALCULATION
  const isFullscreen = strategyContext.isParametersFullscreen || false

  let leftPadding: string
  let rightPadding: string

  if (isFullscreen) {
    // Fullscreen mode: no side panels
    leftPadding = '32px'
    rightPadding = '32px'
  } else if (isLargeScreen) {
    // Large screen (≥1920px): Support 3-panel layout
    leftPadding = isSidebarOpen ? '300px' : '32px'
    // CRITICAL: Only apply details panel padding on /create page
    rightPadding = (isDetailsPanelOpen && isCreatePage) ? 'calc(50% + 32px)' : '32px'
  } else {
    // Small/Medium screen (≤1919px): Max 2 panels
    // Sidebar takes priority when both try to open (handled by auto-close logic)
    leftPadding = isSidebarOpen && !isDetailsPanelOpen ? '300px' : '32px'
    // CRITICAL: Only apply details panel padding on /create page
    rightPadding = (isDetailsPanelOpen && isCreatePage) ? 'calc(50% + 32px)' : '32px'
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed at top */}
      <NavigationHeader currentPage={currentPage} />

      {/* Sidebar - Fixed positioning (hidden in fullscreen) */}
      {!isFullscreen && (
        <StrategyPanel
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      {/* Main Content Area */}
      <main
        className="flex-1 overflow-y-auto bg-background"
        style={{
          paddingLeft: leftPadding,
          paddingRight: rightPadding
        }}
      >
        {children}
      </main>

      {/* Details Panel - Fixed positioning */}
      {isCreatePage && (
        <StrategyDetailsPanel
          isOpen={isDetailsPanelOpen}
          onToggle={handleDetailsPanelToggle}
          activeTab={strategyContext.detailsPanelTab}
          onTabChange={strategyContext.setDetailsPanelTab}
          onOpenStrategies={handleOpenStrategies}
          onOpenChat={handleOpenChat}
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
