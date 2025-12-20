"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { NavigationHeader } from "@/components/navigation/NavigationHeader"
import { StrategyPanel } from "@/components/strategy/StrategyPanel"
import { StrategyDetailsPanel } from "@/components/strategy/StrategyDetailsPanel"
import { ChatPanel } from "@/components/strategy/ChatPanel"
import { ChatProvider, useChat } from "@/contexts/ChatContext"
import { storage } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { logger, LogCategory } from "@/lib/debug"

function AuthenticatedLayoutContent({
  children,
  isCreatePage
}: {
  children: React.ReactNode
  isCreatePage: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)

  const chatContext = isCreatePage ? useChat() : null

  const currentPage = pathname?.includes('/create') ? 'create' : 'dashboard'

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

  // Sync isDetailsPanelOpen with ChatContext
  useEffect(() => {
    if (chatContext) {
      setIsDetailsPanelOpen(chatContext.isDetailsPanelOpen)
    }
  }, [chatContext?.isDetailsPanelOpen])

  // Auto-close StrategyPanel when DetailsPanel opens
  useEffect(() => {
    if (isDetailsPanelOpen && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [isDetailsPanelOpen])

  // Auto-close DetailsPanel when StrategyPanel opens (unless fullscreen)
  useEffect(() => {
    if (isSidebarOpen && isDetailsPanelOpen && !chatContext?.isParametersFullscreen) {
      chatContext?.closeDetailsPanel()
    }
  }, [isSidebarOpen])

  if (!storage.hasToken() || isLoading) {
    return null
  }

  const handleDetailsPanelToggle = () => {
    if (chatContext) {
      if (isDetailsPanelOpen) {
        chatContext.closeDetailsPanel()
      } else {
        chatContext.openDetailsPanel()
      }
    }
  }

  const handleOpenStrategies = () => {
    setIsSidebarOpen(true)
  }

  const handleOpenChat = () => {
    if (chatContext) {
      // Collapse fullscreen to restore normal layout where chat is visible
      if (chatContext.isParametersFullscreen) {
        chatContext.collapseParametersFullscreen()
      }
    }
  }

  // Calculate padding based on fullscreen state
  const isFullscreen = chatContext?.isParametersFullscreen || false
  const leftPadding = isFullscreen
    ? '32px'
    : isSidebarOpen && !isDetailsPanelOpen
      ? '300px'
      : '32px'
  const rightPadding = isFullscreen
    ? '32px'
    : isDetailsPanelOpen
      ? 'calc(50% + 32px)'
      : '32px'

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
        className="flex-1 overflow-y-auto bg-background transition-all duration-300"
        style={{
          paddingLeft: leftPadding,
          paddingRight: rightPadding
        }}
      >
        {children}
      </main>

      {/* Details Panel - Fixed positioning */}
      {isCreatePage && chatContext && (
        <StrategyDetailsPanel
          isOpen={isDetailsPanelOpen}
          onToggle={handleDetailsPanelToggle}
          activeTab={chatContext.detailsPanelTab}
          onTabChange={chatContext.setDetailsPanelTab}
          onOpenStrategies={handleOpenStrategies}
          onOpenChat={handleOpenChat}
        />
      )}

      {/* Chat Overlay - Slides left when fullscreen */}
      {isCreatePage && (
        <ChatPanel isSidebarOpen={isSidebarOpen} isFullscreen={isFullscreen} />
      )}
    </div>
  )
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isCreatePage = pathname === '/create'

  return isCreatePage ? (
    <ChatProvider>
      <AuthenticatedLayoutContent isCreatePage={true}>
        {children}
      </AuthenticatedLayoutContent>
    </ChatProvider>
  ) : (
    <AuthenticatedLayoutContent isCreatePage={false}>
      {children}
    </AuthenticatedLayoutContent>
  )
}
