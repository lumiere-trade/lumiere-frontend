"use client"

import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { RecentActivity } from "@/components/dashboard/RecentActivity"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <DashboardStats />
      <EmptyState />
      <RecentActivity />
    </div>
  )
}
