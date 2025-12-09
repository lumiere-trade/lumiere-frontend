"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { NavigationHeader } from "@/components/navigation/NavigationHeader"
import { StrategyPanel } from "@/components/strategy/StrategyPanel"
import { ChatPanel } from "@/components/strategy/ChatPanel"
import { ChatProvider } from "@/contexts/ChatContext"
import { storage } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { logger, LogCategory } from "@/lib/debug"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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

  if (!storage.hasToken() || isLoading) {
    return null
  }

  const content = (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed at top */}
      <NavigationHeader currentPage={currentPage} />

      {/* Sidebar - Fixed positioning */}
      <StrategyPanel isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content - Flex grow, scrollable */}
      <main
        className="flex-1 overflow-y-auto bg-background transition-all duration-300"
        style={{
          paddingLeft: isSidebarOpen ? '300px' : '32px'
        }}
      >
        {children}
      </main>

      {/* Chat Overlay - Higher z-index */}
      {isCreatePage && <ChatPanel isSidebarOpen={isSidebarOpen} />}
    </div>
  )

  return isCreatePage ? (
    <ChatProvider>{content}</ChatProvider>
  ) : (
    content
  )
}
