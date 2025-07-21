"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DashboardHeaderProps {
  activeTab: string
  onSidebarToggle: () => void
  sidebarOpen: boolean
  isMobile: boolean
}

export function DashboardHeader({ activeTab, onSidebarToggle, sidebarOpen, isMobile }: DashboardHeaderProps) {
  const [notifications] = useState(3)
  const router = useRouter()

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "summary":
        return "Dashboard Overview"
      case "reviews":
        return "Reviews"
      case "review-management":
        return "Review Management"
      case "customization":
        return "Customization"
      case "account":
        return "Account Settings"
      case "upgrade":
        return "Upgrade Plan"
      case "integrations":
        return "Integrations"
      case "billing":
        return "Billing & Subscription"
      default:
        return "Dashboard"
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      sessionStorage.setItem("logout_redirect", "true")
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/auth/login")
    }
  }

  return null
}
