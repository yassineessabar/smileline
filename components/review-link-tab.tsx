"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Copy, ExternalLink, QrCode, UploadCloud, Crown } from "lucide-react" // Added Crown icon
import { toast } from "@/components/ui/use-toast"
import dynamic from "next/dynamic"
import { MobileReviewPreviewDisplay } from "./mobile-review-preview-display"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox

// Dynamically import QRCode to prevent SSR issues
const QRCode = dynamic<any>(
  () => import("qrcode.react").then(mod => ({ default: mod as any })),
  { ssr: false }
)

interface CustomizationSettings {
  company_name: string
  company_logo_url: string | null
  primary_color: string
  secondary_color: string
  show_powered_by: boolean
  messages: {
    rating_page_content: string
    redirect_text: string
    notification_text: string
    video_upload_text: string
  }
  conditional_actions: {
    [key: number]: { type: string; value?: string; platform?: string }
  }
  trustpilot_url: string
  google_url: string
  facebook_url: string // New field for Facebook URL
  selected_review_platform: "Google" | "Trustpilot" | "Facebook" // Updated type
  enabled_platforms: string[] // New field for enabled platforms
}

export function ReviewLinkTab() {
  const [customizationSettings, setCustomizationSettings] = useState<CustomizationSettings>({
    company_name: "Your Company",
    company_logo_url: null,
    primary_color: "#e66465", // Indigo-600
    secondary_color: "#9198e5", // Indigo-500
    show_powered_by: true,
    messages: {
      rating_page_content: "How was your experience with {{companyName}}?",
      redirect_text: "Thank you for your feedback! Please click the button below to leave a review on {{platform}}.",
      notification_text: "Thank you for your feedback! We appreciate you taking the time to share your thoughts.",
      video_upload_text: "Record a short video testimonial for {{companyName}}!",
    },
    conditional_actions: {
      "1": { type: "notify-email" },
      "2": { type: "notify-email" },
      "3": { type: "notify-email" },
      "4": { type: "redirect", platform: "Google" },
      "5": { type: "redirect", platform: "Google" },
    },
    trustpilot_url: "https://www.trustpilot.com/review/example.com",
    google_url: "https://g.page/example/review",
    facebook_url: "https://www.facebook.com/yourpage/reviews/", // Default Facebook URL
    selected_review_platform: "Google", // Default selected platform for static link
    enabled_platforms: ["Google", "Trustpilot", "Video Testimonial"], // Default enabled platforms
  })

  const [reviewLink, setReviewLink] = useState<string>("")
  const [isPremium, setIsPremium] = useState(false) // Placeholder for premium status
  const [previewStep, setPreviewStep] = useState<"initial" | "positiveExperience" | "negativeExperience" | "videoUpload">("initial")
  const [isSaving, setIsSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const platformUrl =
      customizationSettings.selected_review_platform === "Google"
        ? customizationSettings.google_url
        : customizationSettings.trustpilot_url
    // Add Facebook URL if selected as primary
    if (customizationSettings.selected_review_platform === "Facebook") {
      setReviewLink(customizationSettings.facebook_url)
    } else {
      setReviewLink(platformUrl)
    }
  }, [
    customizationSettings.selected_review_platform,
    customizationSettings.google_url,
    customizationSettings.trustpilot_url,
    customizationSettings.facebook_url,
  ])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reviewLink)
    toast({
      title: "Link Copied!",
      description: "The review link has been copied to your clipboard.",
    })
  }

  const handleOpenLink = () => {
    window.open(reviewLink, "_blank")
  }

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCustomizationSettings((prev) => ({ ...prev, company_logo_url: reader.result as string }))
        toast({ title: "Logo Updated!", description: "Preview updated with new logo." })
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDownloadQrCode = () => {
    const svgElement = document.querySelector("#qrcode svg")
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const svgUrl = URL.createObjectURL(svgBlob)

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new window.Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.href = pngFile
        downloadLink.download = "qrcode.png"
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(svgUrl)
        toast({
          title: "QR Code Downloaded!",
          description: "The QR code has been downloaded as a PNG image.",
        })
      }
      img.src = svgUrl
    } else {
      toast({
        title: "Error",
        description: "Could not find QR code to download.",
        variant: "destructive",
      })
    }
  }

  const handlePlatformCheckboxChange = (platform: string, checked: boolean) => {
    setCustomizationSettings((prev) => {
      const newEnabledPlatforms = checked
        ? [...prev.enabled_platforms, platform]
        : prev.enabled_platforms.filter((p) => p !== platform)
      return { ...prev, enabled_platforms: newEnabledPlatforms }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dataToSave = {
        company_name: customizationSettings.company_name,
        company_logo_url: customizationSettings.company_logo_url,
        primary_color: customizationSettings.primary_color,
        secondary_color: customizationSettings.secondary_color,
        show_badge: customizationSettings.show_powered_by,
        rating_page_content: customizationSettings.messages.rating_page_content,
        redirect_message: customizationSettings.messages.redirect_text,
        internal_notification_message: customizationSettings.messages.notification_text,
        video_upload_message: customizationSettings.messages.video_upload_text,
        google_review_link: customizationSettings.google_url,
        trustpilot_review_link: customizationSettings.trustpilot_url,
        facebook_review_link: customizationSettings.facebook_url,
        enabled_platforms: customizationSettings.enabled_platforms,
      }

      const response = await fetch('/api/review-link', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Settings Saved!",
          description: "Your review link settings have been saved successfully.",
        })
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving review link:', error)
      toast({
        title: "Error",
        description: "Failed to save review link settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">

      {/* Left Column: Customization Settings */}
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Review Link Customization</CardTitle>
            <CardDescription>Adjust the appearance and behavior of your review link page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={customizationSettings.company_name}
                onChange={(e) => setCustomizationSettings((prev) => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your Company Name"
              />
              <p className="text-sm text-muted-foreground">This name will appear on your review page.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyLogo">Company Logo</Label>
              <div className="flex items-center gap-4 mt-1">
                <Image
                  src={customizationSettings.company_logo_url || "/placeholder.svg?height=64&width=64&text=Logo"}
                  alt="Company Logo"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain rounded-full border"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="sr-only"
                  accept="image/*"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-transparent">
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Logo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Upload your company logo. Max 64x64px for best display.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={customizationSettings.primary_color}
                  onChange={(e) => setCustomizationSettings((prev) => ({ ...prev, primary_color: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Main accent color for buttons and elements.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={customizationSettings.secondary_color}
                  onChange={(e) => setCustomizationSettings((prev) => ({ ...prev, secondary_color: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Used for gradients and secondary accents.</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showPoweredBy">
                Show "Powered by Loop" Badge <Crown className="inline-block h-4 w-4 ml-1 text-yellow-500" />
              </Label>
              <Switch
                id="showPoweredBy"
                checked={customizationSettings.show_powered_by}
                onCheckedChange={(checked) =>
                  setCustomizationSettings((prev) => ({ ...prev, show_powered_by: checked }))
                }
                disabled={!isPremium} // Disable if not premium
              />
            </div>
            {!isPremium && (
              <p className="text-sm text-muted-foreground text-right">
                <span className="text-yellow-600">Premium feature:</span> Upgrade to hide this badge.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Customize the text displayed on your review page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="ratingPageContent">Rating Page Content</Label>
              <Textarea
                id="ratingPageContent"
                value={customizationSettings.messages.rating_page_content}
                onChange={(e) =>
                  setCustomizationSettings((prev) => ({
                    ...prev,
                    messages: { ...prev.messages, rating_page_content: e.target.value },
                  }))
                }
                placeholder="How was your experience with {{companyName}}?"
              />
              <p className="text-sm text-muted-foreground">
                Use `{"{{companyName}}"}` as a placeholder for your company name.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="redirectText">Redirect Message</Label>
              <Textarea
                id="redirectText"
                value={customizationSettings.messages.redirect_text}
                onChange={(e) =>
                  setCustomizationSettings((prev) => ({
                    ...prev,
                    messages: { ...prev.messages, redirect_text: e.target.value },
                  }))
                }
                placeholder="Thank you for your feedback! Please click the button below to leave a review on {{platform}}."
              />
              <p className="text-sm text-muted-foreground">
                Displayed when a user is redirected to a review platform. Use `{"{{platform}}"}`.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notificationText">Internal Notification Message</Label>
              <Textarea
                id="notificationText"
                value={customizationSettings.messages.notification_text}
                onChange={(e) =>
                  setCustomizationSettings((prev) => ({
                    ...prev,
                    messages: { ...prev.messages, notification_text: e.target.value },
                  }))
                }
                placeholder="Thank you for your feedback! We appreciate you taking the time to share your thoughts."
              />
              <p className="text-sm text-muted-foreground">
                Shown when feedback is submitted internally (e.g., for negative reviews).
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="videoUploadText">Video Upload Message</Label>
              <Textarea
                id="videoUploadText"
                value={customizationSettings.messages.video_upload_text}
                onChange={(e) =>
                  setCustomizationSettings((prev) => ({
                    ...prev,
                    messages: { ...prev.messages, video_upload_text: e.target.value },
                  }))
                }
                placeholder="Record a short video testimonial for {{companyName}}!"
              />
              <p className="text-sm text-muted-foreground">
                Message displayed on the video testimonial upload page. Use `{"{{companyName}}"}`.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Platforms</CardTitle>
            <CardDescription>Configure the URLs for your review platforms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset className="grid gap-2 p-4 border rounded-lg">
              <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 px-2 -ml-2">
                Enable Review Platforms for Positive Feedback
              </legend>
              <div className="space-y-2">
                {["Google",  "Trustpilot", "Facebook", "Video Testimonial"].map((platform) => (
                  <div key={platform} className="flex items-center justify-between">
                    <Label htmlFor={`enable-${platform}`}>{platform}</Label>
                    <Switch
                      id={`enable-${platform}`}
                      checked={customizationSettings.enabled_platforms.includes(platform)}
                      onCheckedChange={(checked) => handlePlatformCheckboxChange(platform, checked as boolean)}
                      // Custom styling for the switch
                      style={
                        {
                          "--tw-ring-color": customizationSettings.primary_color,
                          "--tw-ring-offset-color": "white",
                          "--tw-shadow": "0 0 #0000",
                          "--tw-shadow-colored": "0 0 #0000",
                          "--tw-gradient-from": customizationSettings.primary_color,
                          "--tw-gradient-to": customizationSettings.secondary_color,
                          "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to)`,
                        } as React.CSSProperties
                      }
                      className="data-[state=checked]:bg-gradient-to-r from-[var(--tw-gradient-from)] to-[var(--tw-gradient-to)]"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Select which platforms will be offered to customers after a positive review.
              </p>
            </fieldset>

            <div className="border-t border-gray-200 pt-6 space-y-6">
              <h3 className="text-lg font-semibold">Platform URLs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the direct links to your review pages for enabled platforms.
              </p>

              {customizationSettings.enabled_platforms.includes("Google") && (
                <div className="grid gap-2">
                  <Label htmlFor="googleUrl">Google Review Link</Label>
                  <Input
                    id="googleUrl"
                    value={customizationSettings.google_url}
                    onChange={(e) => setCustomizationSettings((prev) => ({ ...prev, google_url: e.target.value }))}
                    placeholder="https://g.page/your-business/review"
                  />
                  <p className="text-sm text-muted-foreground">
                    Direct link to your Google Business Profile review page.
                  </p>
                </div>
              )}

              {customizationSettings.enabled_platforms.includes("Trustpilot") && (
                <div className="grid gap-2">
                  <Label htmlFor="trustpilotUrl">Trustpilot Review Link</Label>
                  <Input
                    id="trustpilotUrl"
                    value={customizationSettings.trustpilot_url}
                    onChange={(e) => setCustomizationSettings((prev) => ({ ...prev, trustpilot_url: e.target.value }))}
                    placeholder="https://www.trustpilot.com/review/your-company.com"
                  />
                  <p className="text-sm text-muted-foreground">Direct link to your Trustpilot review page.</p>
                </div>
              )}

              {customizationSettings.enabled_platforms.includes("Facebook") && (
                <div className="grid gap-2">
                  <Label htmlFor="facebookUrl">Facebook Review Link</Label>
                  <Input
                    id="facebookUrl"
                    value={customizationSettings.facebook_url}
                    onChange={(e) => setCustomizationSettings((prev) => ({ ...prev, facebook_url: e.target.value }))}
                    placeholder="https://www.facebook.com/yourpage/reviews/"
                  />
                  <p className="text-sm text-muted-foreground">Direct link to your Facebook Page reviews.</p>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Right Column: Mobile Preview and Link */}
      <div className="lg:col-span-2 space-y-6 w-full">
        {/* Your Review Link Card - Moved to top of right column */}
        <Card>
          <CardHeader>
            <CardTitle>Your Review Link</CardTitle>
            <CardDescription>Share this link with your customers to collect reviews.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input readOnly value={reviewLink} className="flex-1" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleOpenLink}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!reviewLink}>
                    <QrCode className="mr-2 h-4 w-4" /> Show QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Scan QR Code</DialogTitle>
                    <DialogDescription>Scan this QR code to access your review link.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center p-4">
                    {reviewLink ? (
                      <div id="qrcode" className="p-2 border border-gray-200 rounded-lg">
                        <QRCode value={reviewLink} size={256} level="H" renderAs="svg" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[256px] w-[256px] text-gray-400 text-sm border border-gray-200 rounded-lg">
                        No link available
                      </div>
                    )}
                    <Button onClick={handleDownloadQrCode} className="mt-4 w-full">
                      Download QR Code
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>


        {/* Right Column: Mobile Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow-inner h-fit overflow-hidden">
          <div className="flex justify-between w-[320px] mb-4">
            <h3 className="text-lg font-semibold">Mobile Preview</h3>
            {/* Removed Edit Mode switch */}
          </div>
          <div className="relative w-[320px] h-[650px] rounded-[40px] bg-black shadow-2xl flex items-center justify-center border-[10px] border-gray-800 overflow-hidden">
            {/* iPhone Bezel */}
            <div className="absolute inset-0 rounded-[35px] border-[2px] border-gray-700 pointer-events-none"></div>

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-xl z-10 flex items-center justify-center">
              <div className="w-10 h-1 bg-gray-700 rounded-full" /> {/* Speaker */}
            </div>

            {/* Screen */}
            <MobileReviewPreviewDisplay
              formData={{
                companyName: customizationSettings.company_name,
                companyLogo: customizationSettings.company_logo_url,
                messages: customizationSettings.messages,
                conditionalActions: customizationSettings.conditional_actions,
                trustpilotUrl: customizationSettings.trustpilot_url,
                googleUrl: customizationSettings.google_url,
                facebookUrl: customizationSettings.facebook_url,
                primaryColor: customizationSettings.primary_color,
                secondaryColor: customizationSettings.secondary_color,
                enabledPlatforms: customizationSettings.enabled_platforms,
              }}
              initialPreviewStep={previewStep}
              setCompanyName={(name) => setCustomizationSettings((prev) => ({ ...prev, company_name: name }))}
              setCompanyLogo={(url) => setCustomizationSettings((prev) => ({ ...prev, company_logo_url: url }))}
              setRatingPageContent={(content) =>
                setCustomizationSettings((prev) => ({
                  ...prev,
                  messages: { ...prev.messages, rating_page_content: content },
                }))
              }
              setRedirectText={(text) =>
                setCustomizationSettings((prev) => ({
                  ...prev,
                  messages: { ...prev.messages, redirect_text: text },
                }))
              }
              setNotificationText={(text) =>
                setCustomizationSettings((prev) => ({
                  ...prev,
                  messages: { ...prev.messages, notification_text: text },
                }))
              }
              setVideoUploadText={(text) =>
                setCustomizationSettings((prev) => ({
                  ...prev,
                  messages: { ...prev.messages, video_upload_text: text },
                }))
              }
              showPoweredBy={customizationSettings.show_powered_by}
              setShowPoweredBy={(value) => setCustomizationSettings((prev) => ({ ...prev, show_powered_by: value }))}
              setTrustpilotUrl={(url) => setCustomizationSettings((prev) => ({ ...prev, trustpilot_url: url }))}
              setGoogleUrl={(url) => setCustomizationSettings((prev) => ({ ...prev, google_url: url }))}
              setFacebookUrl={(url) => setCustomizationSettings((prev) => ({ ...prev, facebook_url: url }))}
              setEnabledPlatforms={(platforms) =>
                setCustomizationSettings((prev) => ({ ...prev, enabled_platforms: platforms }))
              }
            />
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            This is a live preview of how your review page will look on mobile devices. Interact with the preview or use
            the buttons below to see different flows.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={() => setPreviewStep("initial")}>
              Initial View
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewStep("positiveExperience")}>
              Positive Flow
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewStep("negativeExperience")}>
              Negative Flow
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewStep("videoUpload")}>
              Video Upload Flow
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
