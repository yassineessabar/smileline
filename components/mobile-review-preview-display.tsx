"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Star, Video, CheckCircle, Loader2, ArrowLeft } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileReviewPreviewDisplayProps {
  formData: {
    companyName: string
    companyLogo: string | null
    messages: {
      rating_page_content: string
      redirect_text: string
      notification_text: string
      video_upload_text: string
    }
    conditionalActions: {
      [key: number]: { type: string; value?: string; platform?: string }
    }
    trustpilotUrl: string
    googleUrl: string
    facebookUrl: string // New prop for Facebook URL
    primaryColor: string
    secondaryColor: string
    enabledPlatforms: string[] // New prop for enabled platforms
  }
  initialPreviewStep?: "initial" | "positiveExperience" | "negativeExperience" | "videoUpload"
  setCompanyName: (name: string) => void
  setCompanyLogo: (url: string | null) => void
  setRatingPageContent: (content: string) => void
  setRedirectText: (text: string) => void
  setNotificationText: (text: string) => void
  setVideoUploadText: (text: string) => void
  showPoweredBy: boolean
  setShowPoweredBy: (show: boolean) => void
  setTrustpilotUrl: (url: string) => void
  setGoogleUrl: (url: string) => void
  setFacebookUrl: (url: string) => void // New setter
  setEnabledPlatforms: (platforms: string[]) => void // New setter
}

export function MobileReviewPreviewDisplay({
  formData,
  initialPreviewStep = "initial",
  setCompanyName,
  setCompanyLogo,
  setRatingPageContent,
  setRedirectText,
  setNotificationText,
  setVideoUploadText,
  showPoweredBy,
  setShowPoweredBy,
  setTrustpilotUrl,
  setGoogleUrl,
  setFacebookUrl,
  setEnabledPlatforms,
}: MobileReviewPreviewDisplayProps) {
  const {
    companyName,
    companyLogo,
    messages: {
      rating_page_content = "How was your experience with {{companyName}}?",
      redirect_text = "Thank you for your feedback! Please click the button below to leave a review on {{platform}}.",
      notification_text = "Thank you for your feedback! We appreciate you taking the time to share your thoughts.",
      video_upload_text = "Record a short video testimonial for {{companyName}}!",
    },
    conditionalActions,
    trustpilotUrl,
    googleUrl,
    facebookUrl, // Destructure new prop
    primaryColor,
    secondaryColor,
    enabledPlatforms, // Destructure new prop
  } = formData

  const [currentStep, setCurrentStep] = useState(initialPreviewStep)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [agreeToMarketing, setAgreeToMarketing] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [hoverRating, setHoverRating] = useState<number>(0)

  useEffect(() => {
    setCurrentStep(initialPreviewStep)
    setRating(0)
    setHoverRating(0)
    setFeedback("")
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
    setAgreeToMarketing(false)
    setVideoFile(null)
    setVideoPreviewUrl(null)
    setSubmissionSuccess(false)
    setIsSubmitting(false)
  }, [initialPreviewStep])

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating)
    const action = conditionalActions[selectedRating]
    if (action?.type === "redirect" || action?.type === "video-upload") {
      setCurrentStep("positiveExperience") // For redirect or video, go to positive flow to show buttons
    } else {
      setCurrentStep("negativeExperience") // Internal feedback for 1-3 stars or if no specific action
    }
  }

  const handleFeedbackSubmit = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setSubmissionSuccess(true)
    setTimeout(() => {
      setCurrentStep("initial")
      setRating(0)
      setFeedback("")
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setAgreeToMarketing(false)
      setVideoFile(null)
      setVideoPreviewUrl(null)
      setSubmissionSuccess(false)
    }, 3000)
  }

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file)
      setVideoPreviewUrl(URL.createObjectURL(file))
    } else {
      setVideoFile(null)
      setVideoPreviewUrl(null)
    }
  }

  const handleVideoUpload = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setSubmissionSuccess(true)
    setTimeout(() => {
      setCurrentStep("initial")
      setRating(0)
      setFeedback("")
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setAgreeToMarketing(false)
      setVideoFile(null)
      setVideoPreviewUrl(null)
      setSubmissionSuccess(false)
    }, 3000)
  }

  const handleGoBack = () => {
    setCurrentStep("initial")
    setRating(0)
    setHoverRating(0)
    setFeedback("")
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
    setAgreeToMarketing(false)
    setVideoFile(null)
    setVideoPreviewUrl(null)
    setSubmissionSuccess(false)
    setIsSubmitting(false)
  }

  const getDynamicText = useCallback(
    (template: string, platformName?: string) => {
      let text = template.replace(/\{\{companyName\}\}/g, companyName)
      if (platformName) {
        text = text.replace(/\{\{platform\}\}/g, platformName)
      }
      return text
    },
    [companyName],
  )

  const renderContent = () => {
    if (submissionSuccess) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">Success!</h3>
          <p className="text-gray-600 mt-2">
            {rating >= 4 && enabledPlatforms.includes("Video Testimonial")
              ? getDynamicText(video_upload_text)
              : getDynamicText(notification_text)}
          </p>
          <Button variant="link" className="mt-2 text-gray-600" onClick={handleGoBack}>
            Go Back
          </Button>
        </div>
      )
    }

    switch (currentStep) {
      case "initial":
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {companyLogo && (
              <Image
                src={companyLogo || "/placeholder.svg"}
                alt="Company Logo"
                width={80}
                height={80}
                className="h-20 w-20 object-contain rounded-full mb-4"
              />
            )}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{getDynamicText(rating_page_content)}</h3>
            <div className="flex space-x-1 mb-8" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-10 w-10 cursor-pointer transition-colors duration-200
                    ${
                      star <= (hoverRating || rating || 0)
                        ? "fill-[url(#star-gradient)] text-[url(#star-gradient)]"
                        : "fill-gray-300 text-gray-300"
                    }
                  `}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => handleRatingClick(star)}
                />
              ))}
            </div>
          </div>
        )
      case "positiveExperience":
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="absolute top-4 left-4">
              <Button variant="ghost" size="icon" onClick={handleGoBack} className="text-gray-600 hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Great to hear!</h3>
            <p className="text-gray-600 mb-4">{getDynamicText(redirect_text, conditionalActions[rating]?.platform)}</p>
            <div className="w-full space-y-2">
              {enabledPlatforms.includes("Google") && rating >= 4 && (
                <Button
                  className="w-full text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                  onClick={() => window.open(googleUrl, "_blank")}
                >
                  <Image src="/google-logo-new.png" alt="Google Logo" width={20} height={20} /> Submit to Google
                </Button>
              )}
              {enabledPlatforms.includes("Trustpilot") && rating >= 4 && (
                <Button
                  className="w-full text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                  onClick={() => window.open(trustpilotUrl, "_blank")}
                >
                  <Image src="/trustpilot-logo.png" alt="Trustpilot Logo" width={20} height={20} /> Submit to Trustpilot
                </Button>
              )}
              {enabledPlatforms.includes("Facebook") && rating >= 4 && (
                <Button
                  className="w-full text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                  onClick={() => window.open(facebookUrl, "_blank")}
                >
                  <Image src="/facebook-logo.png" alt="Facebook Logo" width={20} height={20} /> Submit to Facebook
                </Button>
              )}
              {enabledPlatforms.includes("Video Testimonial") && rating >= 4 && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => setCurrentStep("videoUpload")}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Video className="mr-2 h-4 w-4" /> Record Video Testimonial
                </Button>
              )}
            </div>
          </div>
        )
      case "negativeExperience":
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="absolute top-4 left-4">
              <Button variant="ghost" size="icon" onClick={handleGoBack} className="text-gray-600 hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">We're sorry to hear that.</h3>
            <p className="text-gray-600 mb-4">Please tell us how we can improve:</p>
            <Input
              placeholder="Your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full mb-2 rounded-md border-gray-300 focus:border-opacity-80 focus:ring-opacity-80"
              style={
                {
                  borderColor: secondaryColor,
                  "--tw-ring-color": secondaryColor,
                } as React.CSSProperties
              }
            />
            <Input
              type="email"
              placeholder="Your email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full mb-2 rounded-md border-gray-300 focus:border-opacity-80 focus:ring-opacity-80"
              style={
                {
                  borderColor: secondaryColor,
                  "--tw-ring-color": secondaryColor,
                } as React.CSSProperties
              }
            />
            <Input
              placeholder="Phone with area code (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full mb-2 rounded-md border-gray-300 focus:border-opacity-80 focus:ring-opacity-80"
              style={
                {
                  borderColor: secondaryColor,
                  "--tw-ring-color": secondaryColor,
                } as React.CSSProperties
              }
            />
            <Textarea
              placeholder="Your feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full mb-4 rounded-md border-gray-300 focus:border-opacity-80 focus:ring-opacity-80 min-h-[80px]"
              style={
                {
                  borderColor: secondaryColor,
                  "--tw-ring-color": secondaryColor,
                } as React.CSSProperties
              }
            />
            <Button
              className="w-full text-white"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
              onClick={handleFeedbackSubmit}
              disabled={isSubmitting || !customerName || !customerEmail || !feedback}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        )
      case "videoUpload":
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="absolute top-4 left-4">
              <Button variant="ghost" size="icon" onClick={handleGoBack} className="text-gray-600 hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{getDynamicText(video_upload_text)}</h3>
            {videoPreviewUrl ? (
              <video src={videoPreviewUrl} controls className="w-full max-h-48 object-contain mb-4 rounded-md" />
            ) : (
              <div
                className="w-full h-32 border-2 border-dashed rounded-md flex items-center justify-center text-gray-500 mb-4 cursor-pointer"
                onClick={() => document.getElementById("video-upload-input")?.click()}
              >
                <UploadCloud className="h-8 w-8 mr-2" /> Upload Video
              </div>
            )}
            <input
              id="video-upload-input"
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="hidden"
            />
            <Input
              placeholder="Your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full mb-2 rounded-md border-gray-300 focus:border-opacity-80 focus:ring-opacity-80"
              style={
                {
                  borderColor: secondaryColor,
                  "--tw-ring-color": secondaryColor,
                } as React.CSSProperties
              }
            />
            <Input
              type="email"
              placeholder="Your email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full mb-2 rounded-md border-gray-300 focus:border-opacity-80 focus:ring-opacity-80"
              style={
                {
                  borderColor: secondaryColor,
                  "--tw-ring-color": secondaryColor,
                } as React.CSSProperties
              }
            />
            <div className="flex items-center space-x-2 w-full mb-4">
              <Checkbox
                id="marketing-agreement"
                checked={agreeToMarketing}
                onCheckedChange={(checked) => setAgreeToMarketing(checked as boolean)}
                className="border-gray-300 data-[state=checked]:bg-gradient-to-r"
                style={
                  {
                    "--tw-gradient-from": primaryColor,
                    "--tw-gradient-to": secondaryColor,
                  } as React.CSSProperties
                }
              />
              <Label htmlFor="marketing-agreement" className="text-sm text-gray-700">
                I agree that my video could be used by the company for marketing purposes
              </Label>
            </div>
            <Button
              className="w-full text-white"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
              onClick={handleVideoUpload}
              disabled={!videoFile || isSubmitting || !customerName || !customerEmail || !agreeToMarketing}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Submit Video"
              )}
            </Button>
          </div>
          
        )
      default:
        return null
    }
  }

  return (
    <div className="relative w-full h-full bg-white rounded-[30px] overflow-hidden flex flex-col">
      {/* Define SVG gradient for stars */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Content Area - now with white background */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white text-gray-800">
        {renderContent()}
      </div>
      {showPoweredBy && (
        <div className="absolute bottom-0 left-0 right-0 p-2 text-center text-xs text-gray-500 bg-white border-t">
          Powered by Loop
        </div>
      )}
    </div>
  )
}
