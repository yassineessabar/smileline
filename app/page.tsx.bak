"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SummaryTab } from "@/components/summary-tab"
import { ReviewsDisplay } from "@/components/reviews-display"
import { AccountTab } from "@/components/account-tab"
import { UpgradePage } from "@/components/upgrade-page"
import { IntegrationsTab } from "@/components/integrations-tab"
import { BillingSubscriptionPage } from "@/components/billing-subscription-page"
import { ReviewLinkTab } from "@/components/review-link-tab"
import AppearancePage from "@/components/appearance-page"
import { GetReviewsTab } from "@/components/get-reviews-tab" // Re-import GetReviewsTab
import { RequestsSentTab } from "@/components/requests-sent-tab"
import { CustomersTab } from "@/components/customers-tab"
// import { OnboardingModal } from "@/components/onboarding-modal"
import { SupportChatbot } from "@/components/support-chatbot"
import { SettingsPage } from "@/components/settings-page"
// import { WidgetsTab } from "@/components/widgets-tab" // Removed WidgetsTab import

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth()
  const { userInfo, hasActiveSubscription } = useSubscription()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("summary")

  // Enhanced setActiveTab that dispatches custom event for data refetching
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    // Dispatch custom event to notify components about tab switch
    window.dispatchEvent(new CustomEvent('tab-switched', { detail: newTab }))
  }
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      handleTabChange(tab)
    }
  }, [searchParams])

  // Redirect if not authenticated (using AuthProvider)
  useEffect(() => {
    // Check if user just completed onboarding or is in onboarding flow
    const justCompletedOnboarding = sessionStorage.getItem('onboarding_completed')
    const onboardingInProgress = sessionStorage.getItem('onboarding_in_progress')

    if (!loading && !isAuthenticated) {
      // If user just completed onboarding or is in onboarding flow, give auth a moment to update
      if (justCompletedOnboarding || onboardingInProgress) {
        sessionStorage.removeItem('onboarding_completed')
        sessionStorage.removeItem('onboarding_in_progress')
        // Wait longer for auth to propagate and try refreshing auth state
        setTimeout(() => {
          // Force a page reload to ensure auth state is fresh
          window.location.reload()
        }, 1000)
      } else {
        router.push("/auth/login")
      }
    } else if (!loading && isAuthenticated) {
      // User is authenticated, clean up any onboarding flags
      if (justCompletedOnboarding) {
        sessionStorage.removeItem('onboarding_completed')
      }
      if (onboardingInProgress) {
        sessionStorage.removeItem('onboarding_in_progress')
      }
    }
  }, [loading, isAuthenticated, router])

  // Detect mobile screen size
  useEffect(() => {
    if (typeof window === 'undefined') return

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

  // Removed onboarding handlers

  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return <SummaryTab onTabChange={handleTabChange} />
      case "reviews":
        return <ReviewsDisplay />
      case "customers":
        return <CustomersTab />
      case "get-reviews":
        return <GetReviewsTab />
      case "requests-sent":
        return <RequestsSentTab />
      case "integrations":
        return <IntegrationsTab />
      case "billing":
        return <BillingSubscriptionPage />
      case "review-link":
        return <ReviewLinkTab mode="links" onTabChange={handleTabChange} />
      case "appearance":
        return <AppearancePage onTabChange={handleTabChange} />
      case "settings":
        return <SettingsPage onSectionChange={handleTabChange} />
      case "account":
        return <AccountTab onTabChange={handleTabChange} />
      case "upgrade":
        return <UpgradePage onTabChange={handleTabChange} />
      // case "widgets": // Removed WidgetsTab case
      //   return <WidgetsTab /> // Removed
      default:
        return <SummaryTab onTabChange={handleTabChange} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(243,243,241)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-violet-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-[rgb(243,243,241)] relative">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          handleTabChange(tab)
          // Update URL without page reload
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set("tab", tab)
            window.history.pushState({}, "", url.toString())
          }
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

      {/* Support Chatbot */}
      <SupportChatbot />
    </div>
  )
}
