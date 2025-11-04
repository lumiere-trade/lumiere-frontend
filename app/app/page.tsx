"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLoginWall } from "@/components/AdminLoginWall"
import { storage } from "@/lib/api"
import { logger, LogCategory } from "@/lib/debug"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    logger.info(LogCategory.AUTH, 'Root page mounted, checking JWT...')
    
    if (storage.hasToken()) {
      logger.info(LogCategory.AUTH, 'JWT found, redirecting to dashboard')
      router.replace("/dashboard")
    } else {
      logger.info(LogCategory.AUTH, 'No JWT found, redirecting to login')
      router.replace("/login")
    }
  }, [router])

  return (
    <AdminLoginWall>
      <div className="min-h-screen bg-background" />
    </AdminLoginWall>
  )
}
