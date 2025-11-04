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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-8">
      <div className="text-center space-y-3">
        <h1 className="text-6xl md:text-7xl font-bold tracking-wider text-primary">LUMIÈRE</h1>
        <p className="text-sm md:text-base text-muted-foreground tracking-wide">
          Blind to emotion, guided by algorithm
        </p>
      </div>

      <WalletConnectSection />
    </div>
  )
}
