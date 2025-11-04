"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { WalletConnectSection } from "@/components/auth/WalletConnectSection"
import { storage } from "@/lib/api"
import { logger, LogCategory } from "@/lib/debug"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    logger.info(LogCategory.AUTH, 'Login page mounted, checking JWT...')
    
    if (storage.hasToken()) {
      logger.info(LogCategory.AUTH, 'JWT found, redirecting to dashboard')
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <WalletConnectSection />
    </div>
  )
}
