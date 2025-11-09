"use client"

import { useState, useEffect, cloneElement, isValidElement } from "react"
import { useRouter, usePathname } from "next/navigation"
import { NavigationHeader } from "@/components/navigation/NavigationHeader"
import { StrategyPanel } from "@/components/strategy/StrategyPanel"
import { Footer } from "@lumiere/shared/components"
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

  // Pass isSidebarOpen to children
  const childrenWithProps = isValidElement(children)
    ? cloneElement(children, { isSidebarOpen } as any)
    : children

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader currentPage={currentPage} isSidebarOpen={isSidebarOpen} />

      <StrategyPanel isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main
        className="pt-[54px] pb-[80px] transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? '300px' : '0',
          width: isSidebarOpen ? 'calc(100vw - 300px)' : '100vw'
        }}
      >
        {childrenWithProps}
      </main>

      <Footer isSidebarOpen={isSidebarOpen} />
    </div>
  )
}
