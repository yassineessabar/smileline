"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SummaryTab } from "@/components/summary-tab"
import { ReviewsTab } from "@/components/reviews-tab"
import { AccountTab } from "@/components/account-tab"
import { UpgradePage } from "@/components/upgrade-page"
import { IntegrationsTab } from "@/components/integrations-tab"
import { BillingSubscriptionPage } from "@/components/billing-subscription-page"
import { ReviewLinkTab } from "@/components/review-link-tab"
import { GetReviewsTab } from "@/components/get-reviews-tab" // Re-import GetReviewsTab
// import { WidgetsTab } from "@/components/widgets-tab" // Removed WidgetsTab import

export default function Dashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("summary")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setIsAuthenticated(true)
          } else {
            router.push("/auth/login")
          }
        } else {
          router.push("/auth/login")
        }
      } catch {
        router.push("/auth/login")
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-minimize sidebar on mobile
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return <SummaryTab />
      case "reviews":
        return <ReviewsTab />
      case "get-reviews": // Re-added Get Reviews tab
        return <GetReviewsTab />
      case "account":
        return <AccountTab />
      case "upgrade":
        return <UpgradePage />
      case "integrations":
        return <IntegrationsTab />
      case "billing":
        return <BillingSubscriptionPage />
      case "review-link":
        return <ReviewLinkTab />
      // case "widgets": // Removed WidgetsTab case
      //   return <WidgetsTab /> // Removed
      default:
        return <SummaryTab />
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e66465] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          // Update URL without page reload
          const url = new URL(window.location.href)
          url.searchParams.set("tab", tab)
          window.history.pushState({}, "", url.toString())
          // Auto-close sidebar on mobile after selection
          if (isMobile) {
            setSidebarOpen(false)
          }
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader
          activeTab={activeTab}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{renderContent()}</div>
        </main>
      </div>
    </div>
  )
}
