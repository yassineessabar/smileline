"use client"
import { BarChart3, MessageSquare, User, Plug, Mail, Link, LogOut, Send, Crown, Sparkles, Settings, Users, Menu, Palette, BarChart2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useCompanyLogo } from "@/hooks/useCompanyLogo"
import { UpgradeProDialog } from "@/components/upgrade-pro-dialog"
import { useState, useEffect, useCallback } from "react"

interface DashboardSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onToggle: () => void
  isMobile?: boolean
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  isMobile = false,
}: DashboardSidebarProps) {
  const router = useRouter()
  const { logoUrl, loading: logoLoading } = useCompanyLogo()
  const [companyName, setCompanyName] = useState("Loop")
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email?: string; id?: string }>({})
  const [lastFetchTime, setLastFetchTime] = useState(0)

  const fetchUserData = useCallback(async (force = false) => {
    // Prevent duplicate API calls within 30 seconds unless forced
    const now = Date.now()
    if (!force && now - lastFetchTime < 30000) {
      return
    }

    try {
      const response = await fetch("/api/auth/me", { 
        credentials: "include",
        cache: "no-cache"
      })
      const result = await response.json()

      if (result.success && result.user) {
        const newCompanyName = result.user.company || "Loop"
        setCompanyName(newCompanyName)
        
        setUserInfo({
          email: result.user.email,
          id: result.user.id
        })
        
        // Check if user has an active subscription (not free)
        const hasActiveSubscription = result.user.subscription_type && 
          result.user.subscription_type !== 'free' && 
          result.user.subscription_status === 'active'
        setIsPremium(hasActiveSubscription)
        setLastFetchTime(now)
      } else {
        setCompanyName("Loop")
        setIsPremium(false)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setCompanyName("Loop")
      setIsPremium(false)
    } finally {
      setLoading(false)
    }
  }, [lastFetchTime])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // Listen for subscription changes
  useEffect(() => {
    const handleTabSwitch = (e: CustomEvent) => {
      if (e.detail === 'billing' || e.detail === 'upgrade') {
        // Force refresh user data when visiting billing/upgrade tabs
        fetchUserData(true)
      }
    }

    window.addEventListener('tab-switched', handleTabSwitch as EventListener)
    return () => window.removeEventListener('tab-switched', handleTabSwitch as EventListener)
  }, [fetchUserData])

  const mainMenuItems = [
    { id: "review-link", label: "Links", icon: Link },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "summary", label: "Insights", icon: BarChart3 },
    { id: "customers", label: "Audience", icon: Users },
  ]

  const toolsMenuItems = [
    { id: "reviews", label: "Reviews", icon: MessageSquare },
    { 
      id: "get-reviews", 
      label: "Campaigns", 
      icon: Mail,
      subItems: [
        { id: "get-reviews", label: "Campaign Settings", icon: Mail },
        { id: "requests-sent", label: "Inbox", icon: Send },
      ]
    },
    { id: "integrations", label: "Integrations", icon: Plug },
  ]

  // Removed settings menu item - now accessed via company button

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        router.push("/auth/login")
      } else {
        console.error("Logout failed:", await response.json())
      }
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const handleUpgrade = () => {
    onTabChange?.("upgrade")
  }

  // New design for desktop, keeping mobile responsive
  if (!isMobile) {
    return (
      <aside className="flex flex-col rounded-2xl bg-gray-50 p-4 dark:bg-gray-900 h-full max-w-[250px] my-8 ml-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-6">
          <Sparkles className="h-5 w-5 text-violet-600" />
        </div>
        
        <nav className="flex-1 space-y-4 overflow-y-auto">
          {/* Main Navigation Items */}
          <div className="space-y-0.5">
            {mainMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-lg px-2.5 py-1.5 h-10 text-base",
                    isActive
                      ? "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900 dark:text-violet-400 dark:hover:bg-violet-800"
                      : "text-black hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </div>

          {/* Tools Section */}
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2.5 py-1">Tools</p>
            {toolsMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isParentActive = hasSubItems && item.subItems.some(subItem => activeTab === subItem.id)
              const isPremiumFeature = item.isPremium && !isPremium
              
              // If it's a premium feature and user doesn't have access, wrap in upgrade dialog
              if (isPremiumFeature) {
                return (
                  <div key={item.id}>
                    <UpgradeProDialog>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 rounded-lg px-2.5 py-1.5 h-10 text-base",
                          "text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800 cursor-pointer"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        <Lock className="h-3 w-3 ml-auto text-gray-400" />
                      </Button>
                    </UpgradeProDialog>
                  </div>
                )
              }
              
              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 rounded-lg px-2.5 py-1.5 h-10 text-base",
                      (isActive || isParentActive)
                        ? "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900 dark:text-violet-400 dark:hover:bg-violet-800"
                        : "text-black hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                    onClick={() => onTabChange(hasSubItems ? item.subItems[0].id : item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                  
                  {hasSubItems && (isParentActive || isActive) && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubActive = activeTab === subItem.id
                        
                        return (
                          <Button
                            key={subItem.id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start gap-3 rounded-lg px-2.5 py-1 h-8 text-sm",
                              isSubActive
                                ? "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900 dark:text-violet-400 dark:hover:bg-violet-800"
                                : "text-black hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                            )}
                            onClick={() => onTabChange(subItem.id)}
                          >
                            <SubIcon className="h-3.5 w-3.5" />
                            {subItem.label}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Settings removed - now accessed via company button */}
        </nav>
        
        <div className="mt-auto space-y-2 pb-16">
          {!isPremium && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-full border-violet-300 bg-violet-50 px-4 py-3 h-12 text-base text-violet-600 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900 dark:text-violet-400 dark:hover:bg-violet-800"
              onClick={handleUpgrade}
            >
              <Crown className="h-4 w-4" />
              Try Pro for free
            </Button>
          )}
          
          <Button
  variant="outline"
  className="w-full justify-start gap-3 rounded-full border-gray-300 bg-gray-50 px-4 py-3 h-12 text-base text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
  onClick={() => onTabChange("settings")}
>
  <Avatar className="h-6 w-6 min-w-[1.5rem]">
    <AvatarImage src={logoUrl || "/placeholder.svg?height=24&width=24"} alt="Company Logo" />
    <AvatarFallback className="text-xs">{companyName ? companyName[0].toUpperCase() : 'C'}</AvatarFallback>
  </Avatar>
  <span className="text-base truncate">@{companyName.toLowerCase().replace(/\s+/g, '')}</span>
</Button>
        </div>
      </aside>
    )
  }

  // Mobile sidebar remains the same
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200/60 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="p-4 border-b border-gray-200/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img src={logoUrl || "/loop-logo.png"} alt="Company Logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">Review Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-4">
        {/* Main Navigation Items */}
        <ul className="space-y-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10 px-3 transition-all duration-200",
                    isActive
                      ? "bg-black text-white hover:bg-gray-800"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="truncate text-sm font-medium">{item.label}</span>
                </Button>
              </li>
            )
          })}
        </ul>

        {/* Tools Section */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Tools</p>
          <ul className="space-y-2">
            {toolsMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isParentActive = hasSubItems && item.subItems.some(subItem => activeTab === subItem.id)
              const isPremiumFeature = item.isPremium && !isPremium

              // If it's a premium feature and user doesn't have access, wrap in upgrade dialog
              if (isPremiumFeature) {
                return (
                  <li key={item.id}>
                    <UpgradeProDialog>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-10 px-3 transition-all duration-200",
                          "text-gray-400 hover:bg-gray-50 cursor-pointer"
                        )}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="truncate text-sm font-medium">{item.label}</span>
                        <Lock className="w-4 h-4 ml-auto text-gray-400" />
                      </Button>
                    </UpgradeProDialog>
                  </li>
                )
              }

              return (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-10 px-3 transition-all duration-200",
                      (isActive || isParentActive)
                        ? "bg-black text-white hover:bg-gray-800"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    )}
                    onClick={() => onTabChange(hasSubItems ? item.subItems[0].id : item.id)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="truncate text-sm font-medium">{item.label}</span>
                  </Button>
                  
                  {hasSubItems && (isParentActive || isActive) && (
                    <ul className="ml-6 mt-2 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubActive = activeTab === subItem.id
                        
                        return (
                          <li key={subItem.id}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start h-8 px-3 transition-all duration-200",
                                isSubActive
                                  ? "bg-black text-white hover:bg-gray-800"
                                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                              )}
                              onClick={() => onTabChange(subItem.id)}
                            >
                              <SubIcon className="w-4 h-4 mr-2" />
                              <span className="truncate text-xs font-medium">{subItem.label}</span>
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Settings removed - now accessed via company button */}
      </nav>

      {!isPremium && (
        <div className="p-4 border-t border-gray-200/60">
          <Button
            className="w-full bg-black hover:bg-gray-800 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-full h-12 px-4 py-3 text-base"
            onClick={handleUpgrade}
          >
            <Crown className="w-5 h-5 mr-3" />
            <span className="truncate font-medium">Upgrade to Pro</span>
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      <div className={cn("p-4", isPremium ? "border-t border-gray-200/60" : "")}>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 rounded-full border-gray-300 bg-gray-50 px-4 py-3 h-12 text-base text-gray-700 hover:bg-gray-100 transition-all duration-200"
          onClick={() => onTabChange("settings")}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={logoUrl || "/placeholder.svg?height=24&width=24"} alt="Company Logo" />
            <AvatarFallback className="text-xs">{companyName ? companyName[0].toUpperCase() : 'C'}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium">@{companyName.toLowerCase().replace(/\s+/g, '')}</span>
        </Button>
      </div>
    </div>
  )
}
