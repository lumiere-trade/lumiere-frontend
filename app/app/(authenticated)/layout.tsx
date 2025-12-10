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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed at top */}
      <NavigationHeader currentPage={currentPage} />

      {/* Sidebar - Fixed positioning */}
      <StrategyPanel 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content Area - Flex container for chat and details panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Chat/Page */}
        <main
          className="flex-1 overflow-y-auto bg-background transition-all duration-300"
          style={{
            paddingLeft: isSidebarOpen && !isDetailsPanelOpen ? '300px' : '32px'
          }}
        >
          {children}
        </main>

        {/* Details Panel - Right side as flex item */}
        {isCreatePage && chatContext && (
          <StrategyDetailsPanel
            isOpen={isDetailsPanelOpen}
            onToggle={handleDetailsPanelToggle}
            activeTab={chatContext.detailsPanelTab}
            onTabChange={chatContext.setDetailsPanelTab}
            strategy={chatContext.generatedStrategy}
          />
        )}
      </div>

      {/* Chat Overlay - Higher z-index */}
      {isCreatePage && <ChatPanel isSidebarOpen={isSidebarOpen} />}
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
