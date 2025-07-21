"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image" // Import Image component for logos
import { Search, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Integration } from "@/types/db" // Assuming Integration type is simplified

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data for Google and Facebook based on screenshot
  const mockIntegrations: Integration[] = [
    {
      id: "google",
      name: "Google",
      description: "Connect directly with Google to enable replying to reviews.",
      status: "connected", // Google is connected in the screenshot
      last_sync: new Date().toISOString(),
      user_id: "1",
    },
  ]

  const fetchIntegrationsData = useCallback(async () => {
    setLoading(true)
    // In a real app, you would fetch from your API.
    // For this example, we'll use mock data.
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
    setIntegrations(mockIntegrations)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchIntegrationsData()
  }, [fetchIntegrationsData])

  const handleToggleIntegration = async (integrationId: string, currentStatus: string) => {
    const newStatus = currentStatus === "connected" ? "disconnected" : "connected"
    // Simulate API call to update status
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId ? { ...integration, status: newStatus } : integration,
      ),
    )
    setLoading(false)
    alert(`Integration ${newStatus} successfully!`)
    // In a real app, you would make an actual API call here:
    // try {
    //   const response = await fetch(`/api/integrations/${integrationId}`, {
    //     method: "PUT",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ status: newStatus }),
    //   })
    //   const result = await response.json()
    //   if (result.success) {
    //     alert(`Integration ${newStatus} successfully!`)
    //     fetchIntegrationsData() // Re-fetch to update UI
    //   } else {
    //     console.error("Error toggling integration:", result.error)
    //     alert("Failed to toggle integration status.")
    //   }
    // } catch (error) {
    //   console.error("Error toggling integration:", error)
    //   alert("Failed to toggle integration status.")
    // }
  }

  const filteredIntegrations = integrations.filter((integration) =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const integratedCount = integrations.filter((i) => i.status === "connected").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#e66465] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Integrations Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 max-w-2xl">
          Integrate the platforms where you currently receive or wish to receive reviews. Connect directly with Google
          and Facebook via login to enable replying to reviews from the Reviews section. For other platforms, simply
          enter your page link to import reviews. Note that we only import the most recent reviews.
        </p>
      </div>

      {/* Search and Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-0 focus:border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <div className="text-sm text-gray-600">
          Platforms Integrated:{" "}
          <span className="font-semibold">
            {integratedCount}/{integrations.length}
          </span>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className="border border-gray-200/60 shadow-sm relative p-6 flex flex-col items-center justify-center gap-4 rounded-lg"
          >
            {integration.status === "connected" && (
              <CheckCircle className="absolute top-4 right-4 w-6 h-6 text-green-500" />
            )}
            {integration.name === "Google" && (
              <Image src="/google-logo-new.png" alt="Google Logo" width={48} height={48} className="object-contain" />
            )}
            {integration.name === "Facebook" && (
              <Image src="/facebook-logo.png" alt="Facebook Logo" width={48} height={48} className="object-contain" />
            )}
            <h3 className="font-semibold text-lg text-gray-900">{integration.name}</h3>
            <Button
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-100 bg-transparent"
              onClick={() => handleToggleIntegration(integration.id, integration.status)}
            >
              {integration.status === "connected" ? "Edit" : "Integrate"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
