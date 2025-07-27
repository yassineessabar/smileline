"use client"

import { Button } from "@/components/ui/button"
import { Lock, Plus, Check } from "lucide-react"
import { UpgradeProDialog } from "@/components/upgrade-pro-dialog"
import { ShopifyConnectModal } from "@/components/shopify-connect-modal"
import { ShopifyManageModal } from "@/components/shopify-manage-modal"
import { useState, useEffect } from "react"

interface IntegrationCardProps {
  title: string
  description: string
  logoSrc: string
  bannerSrc: string
  isPro?: boolean
  comingSoon?: boolean
}

function IntegrationCard({
  title,
  description,
  logoSrc,
  bannerSrc,
  isPro = true,
  comingSoon = false,
}: IntegrationCardProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [showShopifyManageModal, setShowShopifyManageModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if Shopify is connected on component mount
  useEffect(() => {
    if (title === "Shopify") {
      checkShopifyConnection()
    } else {
      setIsLoading(false)
    }
  }, [title])

  // Listen for URL parameter changes (e.g., when returning from Shopify OAuth)
  useEffect(() => {
    if (title === "Shopify" && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('shopify') === 'connected') {
        // Shopify connection was successful, refresh status
        checkShopifyConnection()
        // Clean up URL parameters
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]shopify=connected/, '').replace(/[?&]customers=syncing/, '')
        window.history.replaceState({}, document.title, newUrl)
      }
    }
  }, [title])

  const checkShopifyConnection = async () => {
    try {
      const response = await fetch('/api/integrations/shopify/status')
      const result = await response.json()

      if (result.success && result.connected) {
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error checking Shopify connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (title === "Shopify") {
      if (isConnected) {
        // If already connected, show manage modal
        setShowShopifyManageModal(true)
      } else {
        setShowShopifyModal(true)
      }
    } else {
      setIsConnected(true)
      setTimeout(() => {}, 500)
    }
  }

  const handleShopifyDisconnect = async () => {
    const response = await fetch('/api/integrations/shopify/disconnect', {
      method: 'POST'
    })
    const result = await response.json()

    if (result.success) {
      setIsConnected(false)
      setShowShopifyManageModal(false)
    } else {
      throw new Error(result.error || 'Failed to disconnect')
    }
  }

  const handleShopifySync = async () => {
    const response = await fetch('/api/integrations/shopify/sync-customers', {
      method: 'POST'
    })
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to sync customers')
    }

    return result.data
  }

  const handleShopifyConnected = () => {
    setIsConnected(true)
    setShowShopifyModal(false)
  }

  const ConnectButton = (
    <Button
      className={`relative transition duration-75 ease-out rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black antialiased h-12 w-full px-4 ${
        isConnected
          ? "text-white bg-green-600 border border-green-600 hover:bg-green-700 active:bg-green-700"
          : "text-black bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:border-gray-300 active:bg-gray-50"
      }`}
      type="button"
      onClick={!isPro ? handleConnect : undefined}
      disabled={isLoading}
    >
      <span className="flex items-center justify-center">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
        ) : isConnected ? (
          <Check className="w-4 h-4 mr-2" />
        ) : null}
        <span className="label block font-semibold text-base">
          {isLoading ? "Checking..." : isConnected ? "Connected" : "Connect"}
        </span>
      </span>
    </Button>
  )

  return (
    <>
      {/* Mobile Button (hidden on desktop) */}
      <button className={`flex w-full items-center gap-3 rounded-[1.25rem] bg-white p-4 md:hidden relative ${comingSoon ? 'blur-sm' : ''}`}>
        <img className="h-[3.125rem] shrink-0 rounded-sm" src={logoSrc} alt="" />
        <div className="text-sm">
          <h2 className="flex flex-wrap text-left font-semibold">
            <span className="mr-2 shrink-0">{title}</span>
          </h2>
          <p className="text-left text-gray-600">{description}</p>
        </div>
        {comingSoon ? (
          <span className="flex items-center gap-1 rounded-full px-2 py-[0.375rem] text-xs leading-none self-start bg-gray-100 text-gray-600 border border-gray-200">
            Coming Soon
          </span>
        ) : isPro && (
          <span className="flex items-center gap-1 rounded-full px-2 py-[0.375rem] text-xs leading-none self-start bg-black text-white">
            <Lock className="w-3 h-3" />
            Pro
          </span>
        )}
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white/90 text-gray-600 px-3 py-1 rounded-full text-sm font-medium border border-gray-200 backdrop-blur-sm shadow-sm">
              Coming Soon
            </span>
          </div>
        )}
      </button>

      {/* Desktop Card (hidden on mobile) */}
      <article className={`relative hidden w-full flex-col overflow-hidden rounded-lg bg-white md:flex ${comingSoon ? 'blur-sm' : ''}`}>
        <div className="relative aspect-video w-full">
          <span className="absolute h-full w-full animate-pulse bg-gray-100"></span>
          <img className="relative z-[2] w-full h-full object-cover" src={bannerSrc} alt="" />
        </div>
        <div className="flex h-full flex-col justify-between p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">{title} sync</h2>
              {comingSoon ? (
                <span className="flex items-center gap-1 rounded-full px-2 py-[0.375rem] text-xs leading-none bg-gray-100 text-gray-600 border border-gray-200">
                  Coming Soon
                </span>
              ) : isPro && (
                <span className="flex items-center gap-1 rounded-full px-2 py-[0.375rem] text-xs leading-none bg-black text-white">
                  <Lock className="w-3 h-3" />
                  Pro
                </span>
              )}
            </div>
            <p className="text-gray-600">{description}</p>
          </div>
          {comingSoon ? (
            <Button
              className="relative transition duration-75 ease-out rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300 antialiased text-gray-600 bg-white backdrop-blur-sm border border-gray-200 hover:bg-gray-50 active:bg-gray-100 h-12 w-full px-4 opacity-60 cursor-not-allowed"
              disabled
            >
              <span className="flex items-center justify-center">
                <span className="label block font-medium text-base">Coming Soon</span>
              </span>
            </Button>
          ) : isPro ? (
            <UpgradeProDialog>{ConnectButton}</UpgradeProDialog>
          ) : (
            ConnectButton
          )}
        </div>
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-none">
            <span className="bg-white/90 text-gray-600 px-4 py-2 rounded-full text-lg font-medium border border-gray-200 backdrop-blur-sm shadow-sm">
              Coming Soon
            </span>
          </div>
        )}
      </article>

      {/* Shopify Connect Modal */}
      {title === "Shopify" && (
        <ShopifyConnectModal
          isOpen={showShopifyModal}
          onClose={() => setShowShopifyModal(false)}
          onConnected={handleShopifyConnected}
        />
      )}

      {/* Shopify Manage Modal */}
      {title === "Shopify" && (
        <ShopifyManageModal
          isOpen={showShopifyManageModal}
          onClose={() => setShowShopifyManageModal(false)}
          onDisconnect={handleShopifyDisconnect}
          onSync={handleShopifySync}
        />
      )}
    </>
  )
}

export function IntegrationsTab() {
  const [userHasPro, setUserHasPro] = useState(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" })
        const data = await response.json()
        if (data.success && data.user) {
          const hasActiveSubscription = data.user.subscription_type &&
            data.user.subscription_type !== 'free' &&
            data.user.subscription_status === 'active'
          setUserHasPro(hasActiveSubscription)
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
      }
    }
    fetchUserInfo()
  }, [])

  const handleExportCSV = () => {
    // Export CSV functionality
    }

  return (
    <div className="flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-6 md:mb-10">
        <span className="flex items-center gap-2">
          <h2 className="text-lg font-extrabold">Audience integrations</h2>
        </span>
        <p className="text-md text-gray-600">
          <span>Once you've started growing an audience list on Linktree, make the most of it using your favorite marketing tools</span>
        </p>
      </div>

      {/* Main Content */}
      <section className="@container md:pb-4 px-16 xl:px-32">
        <div className="mb-10 flex w-full flex-col gap-3 md:grid md:auto-rows-fr md:grid-cols-3 md:gap-6">
          <IntegrationCard
            title="Shopify"
            description="Import your Shopify customers into Loop"
            logoSrc="/shopify-image.jpg"
            bannerSrc="/shopify-image.jpg"
            isPro={false}
            comingSoon={false}
          />

          <IntegrationCard
            title="Kit"
            description="Send new email/SMS contacts straight to Kit automatically"
            logoSrc="https://mfe-grow.production.linktr.ee/images/kit-icon.8f110994.svg"
            bannerSrc="https://mfe-grow.production.linktr.ee/images/kit-banner.93a852c1.svg"
            isPro={!userHasPro}
            comingSoon={true}
          />

          <IntegrationCard
            title="Mailchimp"
            description="Make sure every new contact gets your latest email/SMS"
            logoSrc="https://mfe-grow.production.linktr.ee/images/mailchimp-icon.e630cefe.svg"
            bannerSrc="https://mfe-grow.production.linktr.ee/images/mailchimp-banner.56f65940.svg"
            isPro={!userHasPro}
            comingSoon={true}
          />

          <IntegrationCard
            title="Google Sheets"
            description="Have new contacts update in your spreadsheet"
            logoSrc="https://mfe-grow.production.linktr.ee/images/google-sheets-icon.c117fa67.svg"
            bannerSrc="https://mfe-grow.production.linktr.ee/images/google-sheets-banner.f252b1b7.svg"
            isPro={!userHasPro}
            comingSoon={true}
          />
        </div>

      </section>
    </div>
  )
}