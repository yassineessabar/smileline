"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, DollarSign, Calendar, CheckCircle, Download, ExternalLink, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Subscription, Invoice } from "@/types/db"

export function BillingSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBillingData = useCallback(async () => {
    setLoading(true)
    try {
      const [subscriptionRes, invoicesRes] = await Promise.all([
        fetch("/api/billing/subscription"),
        fetch("/api/billing/invoices"),
      ])

      const [subscriptionData, invoicesData] = await Promise.all([subscriptionRes.json(), invoicesRes.json()])

      if (subscriptionData.success) setSubscription(subscriptionData.data)
      if (invoicesData.success) setInvoices(invoicesData.data)
    } catch (error) {
      console.error("Error fetching billing data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBillingData()
  }, [fetchBillingData])

  const handleManageSubscription = () => {
    alert("Redirecting to subscription management portal...")
    // In a real application, this would redirect to a Stripe/Paddle customer portal
  }

  const handleDownloadInvoice = (url: string) => {
    window.open(url, "_blank")
  }

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#e66465] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card className="bg-white border border-gray-200/60 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Plan
          </CardTitle>
          <CardDescription className="text-gray-600">Details about your current subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {subscription ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Plan Name</h4>
                  <p className="text-gray-700 text-lg font-semibold">{subscription.plan_name}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <Badge
                    className={
                      subscription.status === "active"
                        ? "bg-green-100 text-green-800"
                        : subscription.status === "trialing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Price</h4>
                  <p className="text-gray-700 text-lg font-semibold">
                    {subscription.currency} {subscription.price} / month
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Next Billing Date</h4>
                  <p className="text-gray-700">{subscription.end_date ? formatDate(subscription.end_date) : "N/A"}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Included Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button
                  className="bg-gradient-to-r from-[#e66465] to-[#9198e5] hover:from-[#d55555] hover:to-[#8088d5] text-white"
                  onClick={handleManageSubscription}
                >
                  Manage Subscription
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No active subscription found.</div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="bg-white border border-gray-200/60 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Billing History
          </CardTitle>
          <CardDescription className="text-gray-600">View your past invoices and payment history</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No invoices found.</div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="border border-gray-200/60 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Invoice #{invoice.invoice_number}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(invoice.issue_date)} - {invoice.currency} {invoice.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getInvoiceStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
                        onClick={() => handleDownloadInvoice(invoice.download_url)}
                      >
                        <Download className="w-4 h-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
                        onClick={() => window.open(invoice.download_url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
