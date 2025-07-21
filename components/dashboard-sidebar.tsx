"use client"
import { BarChart3, MessageSquare, User, Plug, Mail, Link, LogOut, ChevronLeft, ChevronRight } from "lucide-react" // Removed Zap icon and added ChevronLeft and ChevronRight
import { useRouter } from "next/navigation" // Import useRouter for redirection

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

  const menuItems = [
    { id: "summary", label: "Dashboard", icon: BarChart3 },
    { id: "reviews", label: "Reviews", icon: MessageSquare },
    { id: "get-reviews", label: "Get Reviews", icon: Mail },
    { id: "review-link", label: "Review Link", icon: Link },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "account", label: "Account", icon: User },
  ]

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        router.push("/auth/login") // Redirect to login page on successful logout
      } else {
        console.error("Logout failed:", await response.json())
        // Optionally, show an error message to the user
      }
    } catch (error) {
      console.error("Error during logout:", error)
      // Optionally, show an error message to the user
    }
  }

  return (
    <>
      {/* Mobile Sidebar */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200/60 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Logo Section */}
          <div className="p-4 border-b border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#e66465] to-[#9198e5] rounded-lg flex items-center justify-center flex-shrink-0">
                <img src="/loop-logo.png" alt="Loop" className="w-6 h-6 object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg text-gray-900 truncate">Loop</h1>
                <p className="text-xs text-gray-500 truncate">Review Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 px-3 transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d55555] hover:to-[#8088d5]"
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
          </nav>

          {/* Logout Button for Mobile */}
          <div className="p-4 border-t border-gray-200/60">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="truncate text-sm font-medium">Logout</span>
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-gray-200/60 transition-all duration-300 ease-in-out flex-col hidden md:flex",
          isOpen ? "w-64" : "w-16",
        )}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#e66465] to-[#9198e5] rounded-lg flex items-center justify-center flex-shrink-0">
              <img src="/loop-logo.png" alt="Loop" className="w-6 h-6 object-contain" />
            </div>
            {isOpen && (
              <div className="min-w-0">
                <h1 className="font-bold text-lg text-gray-900 truncate">Loop</h1>
                <p className="text-xs text-gray-500 truncate">Review Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-10 px-3 transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d55555] hover:to-[#8088d5]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      !isOpen && "justify-center px-0",
                    )}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className={cn("w-5 h-5", isOpen && "mr-3")} />
                    {isOpen && <span className="truncate text-sm font-medium">{item.label}</span>}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button for Desktop */}
        <div className="p-4 border-t border-gray-200/60">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200",
              !isOpen && "justify-center px-0",
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("w-5 h-5", isOpen && "mr-3")} />
            {isOpen && <span className="truncate text-sm font-medium">Logout</span>}
          </Button>
        </div>

        {/* Collapse Toggle - Desktop Only */}
        <div className="p-4 border-t border-gray-200/60">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={onToggle}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </>
  )
}
