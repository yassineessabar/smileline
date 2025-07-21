"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HelpCircle,
  UploadCloud,
  Plus,
  X,
  Send,
  Monitor,
  MessageSquareText,
  Mail,
  QrCode,
  AlertTriangle,
  Copy,
  Download,
  Share2,
  ExternalLink,
} from "lucide-react"
import type { ReviewRequest, TemplateSetting } from "@/types/db"
import { useToast } from "@/hooks/use-toast" // Import useToast
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // Import table components
import { format } from "date-fns" // For date formatting

// Mock user ID for demonstration purposes. In a real app, get this from the session.
const MOCK_USER_ID = "1"

// Component for the phone mockup displaying SMS content
function SmsPhonePreview({ sender, message }: { sender: string; message: string }) {
  return (
    <div className="relative w-full max-w-xs aspect-[9/16] bg-white rounded-3xl shadow-xl border-8 border-gray-100 overflow-hidden flex flex-col items-center justify-start p-4">
      {/* Phone notch/speaker */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-100 rounded-b-lg z-10" />

      {/* Phone header */}
      <div className="w-full flex items-center justify-between text-sm font-semibold text-gray-800 mb-4">
        <span className="text-gray-500">Uboard 2</span>
        <span className="text-gray-500">9:41 AM</span>
      </div>

      {/* Message content */}
      <div className="w-full flex flex-col items-start">
        <div className="bg-gray-100 rounded-lg p-3 max-w-[85%] text-sm text-gray-800">
          <p className="font-semibold mb-1">{sender}</p>
          <p>{message}</p>
          <p className="text-blue-600 underline mt-2">https://go.climbo.com/uboard-2</p>
          <p className="text-xs text-gray-500 mt-2">
            STOP: <span className="text-blue-600 underline">https://optout.so?s=687ca31cb7b40a9f7147c260</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Component for the email mockup displaying email content
function EmailPreview({ senderEmail, subject, message }: { senderEmail: string; subject: string; message: string }) {
  return (
    <div className="relative w-full max-w-md aspect-[4/3] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col items-center justify-start p-4">
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>From: {senderEmail}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Subject: {subject}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 text-sm text-gray-800">
          <p>{message}</p>
          <p className="text-blue-600 underline mt-2">https://go.climbo.com/uboard-2</p>
        </div>
      </div>
    </div>
  )
}

export function GetReviewsTab() {
  const [activeSubTab, setActiveSubTab] = useState("sms")
  const { toast } = useToast() // Initialize useToast

  // SMS States
  const [smsSenderName, setSmsSenderName] = useState("Uboard 2")
  const [smsMessageTemplate, setSmsMessageTemplate] = useState(
    "Hi Name,\nthanks for choosing us. We ask you to leave us a review.\n\nYour link",
  )
  const [smsContacts, setSmsContacts] = useState([{ name: "", number: "" }])
  const [smsConsentChecked, setSmsConsentChecked] = useState(false)
  const [smsReminder3DayEnabled, setSmsReminder3DayEnabled] = useState(false)
  const [smsReminder3DayMessage, setSmsReminder3DayMessage] = useState(
    "Hi Name,\nJust a friendly reminder to leave us a review.\n\nYour link",
  )
  const [smsReminder7DayEnabled, setSmsReminder7DayEnabled] = useState(false)
  const [smsReminder7DayMessage, setSmsReminder7DayMessage] = useState(
    "Hi Name,\nOne last reminder to share your experience with us.\n\nYour link",
  )

  // Email States
  const [emailSenderEmail, setEmailSenderEmail] = useState("reviews@yourcompany.com")
  const [emailSubject, setEmailSubject] = useState("We'd love your feedback!")
  const [emailMessageTemplate, setEmailMessageTemplate] = useState(
    "Hi Name,\nthanks for choosing us. We ask you to leave us a review.\n\nYour link",
  )
  const [emailContacts, setEmailContacts] = useState([{ name: "", email: "" }])
  const [emailConsentChecked, setEmailConsentChecked] = useState(false)
  const [emailReminder3DayEnabled, setEmailReminder3DayEnabled] = useState(false)
  const [emailReminder3DaySubject, setEmailReminder3DaySubject] = useState("Reminder: We'd love your feedback!")
  const [emailReminder3DayMessage, setEmailReminder3DayMessage] = useState(
    "Hi Name,\nJust a friendly reminder to leave us a review.\n\nYour link",
  )
  const [emailReminder7DayEnabled, setEmailReminder7DayEnabled] = useState(false)
  const [emailReminder7DaySubject, setEmailReminder7DaySubject] = useState("Last chance: Your feedback matters!")
  const [emailReminder7DayMessage, setEmailReminder7DayMessage] = useState(
    "Hi Name,\nOne last reminder to share your experience with us.\n\nYour link",
  )

  // QR Code State
  const [reviewLink, setReviewLink] = useState("go.climbo.com/uboard-2")

  // Common States for Requests Sent
  const [searchName, setSearchName] = useState("")
  const [searchContact, setSearchContact] = useState("") // For number or email
  const [searchDate, setSearchDate] = useState("All")
  const [sentRequests, setSentRequests] = useState<ReviewRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  // Loading/Error States for API calls
  const [isSending, setIsSending] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [uploadingCsv, setUploadingCsv] = useState(false)

  // Template Setting IDs (to update existing records)
  const [smsTemplateId, setSmsTemplateId] = useState<string | null>(null)
  const [smsReminder3Id, setSmsReminder3Id] = useState<string | null>(null)
  const [smsReminder7Id, setSmsReminder7Id] = useState<string | null>(null)
  const [emailTemplateId, setEmailTemplateId] = useState<string | null>(null)
  const [emailReminder3Id, setEmailReminder3Id] = useState<string | null>(null)
  const [emailReminder7Id, setEmailReminder7Id] = useState<string | null>(null)

  // Fetch initial template settings on component mount
  useEffect(() => {
    const fetchTemplateSettings = async () => {
      try {
        const response = await fetch(`/api/templates`)
        const result = await response.json()
        if (result.success) {
          result.data.forEach((setting: TemplateSetting) => {
            switch (setting.type) {
              case "sms_template":
                setSmsTemplateId(setting.id)
                setSmsSenderName(setting.sender_name || "Uboard 2")
                setSmsMessageTemplate(setting.content)
                break
              case "sms_reminder_3":
                setSmsReminder3Id(setting.id)
                setSmsReminder3DayEnabled(setting.enabled || false)
                setSmsReminder3DayMessage(setting.content)
                break
              case "sms_reminder_7":
                setSmsReminder7Id(setting.id)
                setSmsReminder7DayEnabled(setting.enabled || false)
                setSmsReminder7DayMessage(setting.content)
                break
              case "email_template":
                setEmailTemplateId(setting.id)
                setEmailSenderEmail(setting.sender_email || "reviews@yourcompany.com")
                setEmailSubject(setting.subject || "We'd love your feedback!")
                setEmailMessageTemplate(setting.content)
                break
              case "email_reminder_3":
                setEmailReminder3Id(setting.id)
                setEmailReminder3DayEnabled(setting.enabled || false)
                setEmailReminder3DaySubject(setting.subject || "Reminder: We'd love your feedback!")
                setEmailReminder3DayMessage(setting.content)
                break
              case "email_reminder_7":
                setEmailReminder7Id(setting.id)
                setEmailReminder7DayEnabled(setting.enabled || false)
                setEmailReminder7DaySubject(setting.subject || "Last chance: Your feedback matters!")
                setEmailReminder7DayMessage(setting.content)
                break
              default:
                break
            }
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to fetch template settings.",
            variant: "destructive",
          })
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to fetch template settings.",
          variant: "destructive",
        })
      }
    }
    fetchTemplateSettings()
  }, [toast])

  // Fetch sent requests
  useEffect(() => {
    const fetchSentRequests = async () => {
      setLoadingRequests(true)
      try {
        const params = new URLSearchParams()
        if (searchName || searchContact) {
          params.append("query", `${searchName} ${searchContact}`.trim())
        }
        if (activeSubTab === "sms" || activeSubTab === "email") {
          params.append("contactType", activeSubTab)
        }
        if (searchDate !== "All") {
          params.append("dateFilter", searchDate)
        }

        const response = await fetch(`/api/review-requests?${params.toString()}`)
        const result = await response.json()
        if (result.success) {
          setSentRequests(result.data)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to fetch sent requests.",
            variant: "destructive",
          })
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to fetch sent requests.",
          variant: "destructive",
        })
      } finally {
        setLoadingRequests(false)
      }
    }
    fetchSentRequests()
  }, [searchName, searchContact, searchDate, activeSubTab, toast])

  const handleAddContactLine = (type: "sms" | "email") => {
    if (type === "sms") {
      setSmsContacts([...smsContacts, { name: "", number: "" }])
    } else {
      setEmailContacts([...emailContacts, { name: "", email: "" }])
    }
  }

  const handleRemoveContactLine = (type: "sms" | "email", index: number) => {
    if (type === "sms") {
      const newContacts = smsContacts.filter((_, i) => i !== index)
      setSmsContacts(newContacts)
    } else {
      const newContacts = emailContacts.filter((_, i) => i !== index)
      setEmailContacts(newContacts)
    }
  }

  const handleContactChange = (
    type: "sms" | "email",
    index: number,
    field: "name" | "number" | "email",
    value: string,
  ) => {
    if (type === "sms") {
      const newContacts = [...smsContacts]
      newContacts[index] = { ...newContacts[index], [field]: value }
      setSmsContacts(newContacts)
    } else {
      const newContacts = [...emailContacts]
      newContacts[index] = { ...newContacts[index], [field]: value }
      setEmailContacts(newContacts)
    }
  }

  const insertIntoMessage = (
    text: string,
    target: "smsTemplate" | "smsReminder3" | "smsReminder7" | "emailTemplate" | "emailReminder3" | "emailReminder7",
    field: "message" | "subject",
  ) => {
    let textareaId: string
    let setter: React.Dispatch<React.SetStateAction<string>>
    let currentValue: string

    if (target === "smsTemplate") {
      textareaId = "sms-message-template"
      setter = setSmsMessageTemplate
      currentValue = smsMessageTemplate
    } else if (target === "smsReminder3") {
      textareaId = "sms-reminder-3-message"
      setter = setSmsReminder3DayMessage
      currentValue = smsReminder3DayMessage
    } else if (target === "smsReminder7") {
      textareaId = "sms-reminder-7-message"
      setter = setSmsReminder7DayMessage
      currentValue = smsReminder7DayMessage
    } else if (target === "emailTemplate") {
      textareaId = field === "message" ? "email-message-template" : "email-subject-template"
      setter = field === "message" ? setEmailMessageTemplate : setEmailSubject
      currentValue = field === "message" ? emailMessageTemplate : emailSubject
    } else if (target === "emailReminder3") {
      textareaId = field === "message" ? "email-reminder-3-message" : "email-reminder-3-subject"
      setter = field === "message" ? setEmailReminder3DayMessage : setEmailReminder3DaySubject
      currentValue = field === "message" ? emailReminder3DayMessage : emailReminder3DaySubject
    } else if (target === "emailReminder7") {
      textareaId = field === "message" ? "email-reminder-7-message" : "email-reminder-7-subject"
      setter = field === "message" ? setEmailReminder7DayMessage : setEmailReminder7DaySubject
      currentValue = field === "message" ? emailReminder7DayMessage : emailReminder7DaySubject
    } else {
      return // Should not happen
    }

    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = currentValue.substring(0, start) + text + currentValue.substring(end)
      setter(newText)

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = start + text.length
        textarea.selectionEnd = start + text.length
      }, 0)
    }
  }

  const handleCopyReviewLink = useCallback(() => {
    navigator.clipboard.writeText(reviewLink)
    toast({
      title: "Copied!",
      description: "Review link copied to clipboard!",
    })
  }, [reviewLink, toast])

  const handleGenerateQrCode = useCallback(() => {
    // In a real application, you would generate the QR code image on the server
    // or use a client-side library like 'qrcode.react' to render it to a canvas
    // and then download it. For this example, we'll simulate a download.
    toast({
      title: "QR Code Generated",
      description: "QR Code generation initiated (placeholder).",
    })
  }, [toast])

  const handleShareLink = useCallback(() => {
    if (navigator.share) {
      navigator
        .share({
          title: "Review Link",
          text: "Check out this review link!",
          url: reviewLink,
        })
        .then(() => {
          toast({
            title: "Shared!",
            description: "Review link shared successfully!",
          })
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: `Failed to share: ${error.message}`,
            variant: "destructive",
          })
        })
    } else {
      navigator.clipboard.writeText(reviewLink)
      toast({
        title: "Copied!",
        description: "Web Share API not supported. Link copied to clipboard instead.",
      })
    }
  }, [reviewLink, toast])

  const handleOpenLink = useCallback(() => {
    window.open(`https://${reviewLink}`, "_blank")
    toast({
      title: "Opening Link",
      description: "Review link opened in a new tab.",
    })
  }, [reviewLink, toast])

  const handleSendReviewRequests = async (type: "sms" | "email") => {
    setIsSending(true)

    const contactsToSend = type === "sms" ? smsContacts : emailContacts
    const consentChecked = type === "sms" ? smsConsentChecked : emailConsentChecked
    const messageContent = type === "sms" ? smsMessageTemplate : emailMessageTemplate

    if (!consentChecked) {
      toast({
        title: "Consent Required",
        description: "Please confirm you have the receiver's consent.",
        variant: "destructive",
      })
      setIsSending(false)
      return
    }

    const requestsPayload = contactsToSend
      .filter((c) => (type === "sms" ? c.number : c.email))
      .map((c) => ({
        customer_name: c.name || null,
        customer_contact: (type === "sms" ? c.number : c.email) as string,
        contact_type: type,
        message_content: messageContent,
        template_id: type === "sms" ? smsTemplateId : emailTemplateId,
      }))

    if (requestsPayload.length === 0) {
      toast({
        title: "No Contacts",
        description: "No valid contacts to send requests to.",
        variant: "destructive",
      })
      setIsSending(false)
      return
    }

    try {
      const response = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestsPayload),
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully sent ${result.data.length} review requests!`,
        })
        // Clear contacts after sending
        if (type === "sms") setSmsContacts([{ name: "", number: "" }])
        else setEmailContacts([{ name: "", email: "" }])
        setSmsConsentChecked(false)
        setEmailConsentChecked(false)
        // Refresh sent requests list
        setSearchName("")
        setSearchContact("")
        setSearchDate("All")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send review requests.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send review requests.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveTemplate = async (type: TemplateSetting["type"]) => {
    setIsSavingTemplate(true)

    let payload: Partial<TemplateSetting> = { type }
    let templateIdToUpdate: string | null = null

    switch (type) {
      case "sms_template":
        payload = { ...payload, sender_name: smsSenderName, content: smsMessageTemplate }
        templateIdToUpdate = smsTemplateId
        break
      case "sms_reminder_3":
        payload = { ...payload, content: smsReminder3DayMessage, enabled: smsReminder3DayEnabled }
        templateIdToUpdate = smsReminder3Id
        break
      case "sms_reminder_7":
        payload = { ...payload, content: smsReminder7DayMessage, enabled: smsReminder7DayEnabled }
        templateIdToUpdate = smsReminder7Id
        break
      case "email_template":
        payload = { ...payload, sender_email: emailSenderEmail, subject: emailSubject, content: emailMessageTemplate }
        templateIdToUpdate = emailTemplateId
        break
      case "email_reminder_3":
        payload = {
          ...payload,
          subject: emailReminder3DaySubject,
          content: emailReminder3DayMessage,
          enabled: emailReminder3DayEnabled,
        }
        templateIdToUpdate = emailReminder3Id
        break
      case "email_reminder_7":
        payload = {
          ...payload,
          subject: emailReminder7DaySubject,
          content: emailReminder7DayMessage,
          enabled: emailReminder7DayEnabled,
        }
        templateIdToUpdate = emailReminder7Id
        break
      default:
        toast({
          title: "Invalid Template Type",
          description: "An invalid template type was provided.",
          variant: "destructive",
        })
        setIsSavingTemplate(false)
        return
    }

    try {
      let response
      if (templateIdToUpdate) {
        response = await fetch("/api/templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: templateIdToUpdate, updates: payload }),
        })
      } else {
        response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Template saved successfully!",
        })
        // Update the ID if it was a new creation
        if (!templateIdToUpdate) {
          switch (type) {
            case "sms_template":
              setSmsTemplateId(result.data.id)
              break
            case "sms_reminder_3":
              setSmsReminder3Id(result.data.id)
              break
            case "sms_reminder_7":
              setSmsReminder7Id(result.data.id)
              break
            case "email_template":
              setEmailTemplateId(result.data.id)
              break
            case "email_reminder_3":
              setEmailReminder3Id(result.data.id)
              break
            case "email_reminder_7":
              setEmailReminder7Id(result.data.id)
              break
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save template.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save template.",
        variant: "destructive",
      })
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const handleUploadCsv = async (event: React.ChangeEvent<HTMLInputElement>, type: "sms" | "email") => {
    setUploadingCsv(true)

    const file = event.target.files?.[0]
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      })
      setUploadingCsv(false)
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("contactType", type)
    formData.append("messageContent", type === "sms" ? smsMessageTemplate : emailMessageTemplate)
    formData.append("templateId", (type === "sms" ? smsTemplateId : emailTemplateId) || "")

    try {
      const response = await fetch("/api/upload-contacts", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: result.message,
        })
        // Refresh sent requests list
        setSearchName("")
        setSearchContact("")
        setSearchDate("All")
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload CSV.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload CSV.",
        variant: "destructive",
      })
    } finally {
      setUploadingCsv(false)
      event.target.value = "" // Clear file input
    }
  }

  const handleExportRequests = async () => {
    try {
      const response = await fetch("/api/export-review-requests")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `review_requests_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast({
          title: "Export Successful",
          description: "Review requests exported successfully!",
        })
      } else {
        const errorText = await response.text()
        toast({
          title: "Export Failed",
          description: `Failed to export: ${errorText}`,
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export review requests.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadQrCode = useCallback(() => {
    // Placeholder for QR code download logic
    toast({
      title: "Download Initiated",
      description: "QR code download will start shortly (placeholder).",
    })
  }, [toast])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Get Reviews</h1>
        <p className="text-gray-600">Invite your customers to leave reviews via SMS, Email, or QR Code.</p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="qr-code" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" /> QR Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms" className="space-y-6 mt-6">
          {/* Request reviews via SMS */}
          <Card className="shadow-sm rounded-lg border border-gray-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Request reviews via SMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Invite your customers</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  Do you have a list of contacts?
                  <Label htmlFor="sms-csv-upload" className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-transparent"
                      disabled={uploadingCsv}
                    >
                      <UploadCloud className="w-4 h-4" /> {uploadingCsv ? "Uploading..." : "Upload CSV (Name, Phone)"}
                    </Button>
                    <Input
                      id="sms-csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleUploadCsv(e, "sms")}
                    />
                  </Label>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>

                {smsContacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label htmlFor={`sms-contact-name-${index}`} className="sr-only">
                      Name
                    </Label>
                    <Input
                      id={`sms-contact-name-${index}`}
                      placeholder="Name"
                      value={contact.name}
                      onChange={(e) => handleContactChange("sms", index, "name", e.target.value)}
                      className="flex-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                    />
                    <Label htmlFor={`sms-contact-number-${index}`} className="sr-only">
                      Number
                    </Label>
                    <div className="relative flex-1">
                      <Input
                        id={`sms-contact-number-${index}`}
                        placeholder="Phone with area code"
                        value={contact.number}
                        onChange={(e) => handleContactChange("sms", index, "number", e.target.value)}
                        className="rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] pl-8"
                      />
                      <MessageSquareText className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {smsContacts.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveContactLine("sms", index)}>
                        <X className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms-consent-checkbox"
                    checked={smsConsentChecked}
                    onCheckedChange={(checked) => setSmsConsentChecked(checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e66465] data-[state=checked]:to-[#9198e5]"
                  />
                  <Label htmlFor="sms-consent-checkbox" className="text-sm text-gray-700">
                    I have the receiver's consent to send a message to this contact
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 shadow-sm rounded-md"
                    onClick={() => handleAddContactLine("sms")}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add line
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                    onClick={() => handleSendReviewRequests("sms")}
                    disabled={isSending || !smsConsentChecked || smsContacts.every((c) => !c.name && !c.number)}
                  >
                    {isSending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Request a review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Template */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex justify-center">
              <SmsPhonePreview sender={smsSenderName} message={smsMessageTemplate} />
            </div>
            <Card className="flex-1 shadow-sm rounded-lg border border-gray-200/60">
              <CardHeader className="pb-4 flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">Edit Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label
                    htmlFor="sms-sender-name"
                    className="text-sm font-medium text-gray-700 flex items-center gap-1"
                  >
                    Customize the sender
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Label>
                  <Input
                    id="sms-sender-name"
                    value={smsSenderName}
                    onChange={(e) => setSmsSenderName(e.target.value)}
                    maxLength={11}
                    className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                  />
                  <div className="text-xs text-gray-500 text-right mt-1">{smsSenderName.length}/11</div>
                </div>

                <div>
                  <Label
                    htmlFor="sms-message-template"
                    className="text-sm font-medium text-gray-700 flex items-center gap-1"
                  >
                    Customize the message
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Label>
                  <Textarea
                    id="sms-message-template"
                    value={smsMessageTemplate}
                    onChange={(e) => setSmsMessageTemplate(e.target.value)}
                    className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] min-h-[120px]"
                  />
                  <div className="text-xs text-gray-500 text-right mt-1">{smsMessageTemplate.length}/5</div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    onClick={() => insertIntoMessage("Company name", "smsTemplate", "message")}
                  >
                    Company name
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    onClick={() => insertIntoMessage("Name", "smsTemplate", "message")}
                  >
                    Name
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    onClick={() => insertIntoMessage("Your link", "smsTemplate", "message")}
                  >
                    Your link
                  </Button>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                  onClick={() => handleSaveTemplate("sms_template")}
                  disabled={isSavingTemplate}
                >
                  {isSavingTemplate ? "Saving..." : "Save template"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Send an automatic SMS reminder */}
          <Card className="shadow-sm rounded-lg border border-gray-200/60 mt-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Send an automatic SMS reminder if the customer doesn&apos;t click on the review link.
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3 Days Reminder */}
              <Card className="shadow-sm rounded-lg border border-gray-200/60">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Trigger reminders after 3 days
                    </CardTitle>
                    <Switch
                      checked={smsReminder3DayEnabled}
                      onCheckedChange={setSmsReminder3DayEnabled}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e66465] data-[state=checked]:to-[#9198e5]"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label
                      htmlFor="sms-reminder-3-message"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Customize the message
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </Label>
                    <Textarea
                      id="sms-reminder-3-message"
                      value={smsReminder3DayMessage}
                      onChange={(e) => setSmsReminder3DayMessage(e.target.value)}
                      className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] min-h-[100px]"
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">{smsReminder3DayMessage.length}/5</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Company name", "smsReminder3", "message")}
                    >
                      Company name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Name", "smsReminder3", "message")}
                    >
                      Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Your link", "smsReminder3", "message")}
                    >
                      Your link
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>
                      You are sending 2 messages. Please note that emojis and certain special characters may increase
                      the total message length.
                    </span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                    onClick={() => handleSaveTemplate("sms_reminder_3")}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>

              {/* 7 Days Reminder */}
              <Card className="shadow-sm rounded-lg border border-gray-200/60">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Trigger reminders after 7 days
                    </CardTitle>
                    <Switch
                      checked={smsReminder7DayEnabled}
                      onCheckedChange={setSmsReminder7DayEnabled}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e66465] data-[state=checked]:to-[#9198e5]"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label
                      htmlFor="sms-reminder-7-message"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Customize the message
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </Label>
                    <Textarea
                      id="sms-reminder-7-message"
                      value={smsReminder7DayMessage}
                      onChange={(e) => setSmsReminder7DayMessage(e.target.value)}
                      className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] min-h-[100px]"
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">{smsReminder7DayMessage.length}/5</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Company name", "smsReminder7", "message")}
                    >
                      Company name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Name", "smsReminder7", "message")}
                    >
                      Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Your link", "smsReminder7", "message")}
                    >
                      Your link
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>
                      You are sending 2 messages. Please note that emojis and certain special characters may increase
                      the total message length.
                    </span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                    onClick={() => handleSaveTemplate("sms_reminder_7")}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6 mt-6">
          {/* Request reviews via Email */}
          <Card className="shadow-sm rounded-lg border border-gray-200/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Request reviews via Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-800">Invite your customers</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  Do you have a list of contacts?
                  <Label htmlFor="email-csv-upload" className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-transparent"
                      disabled={uploadingCsv}
                    >
                      <UploadCloud className="w-4 h-4" /> {uploadingCsv ? "Uploading..." : "Upload CSV (Name, Email)"}
                    </Button>
                    <Input
                      id="email-csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleUploadCsv(e, "email")}
                    />
                  </Label>
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>

                {emailContacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label htmlFor={`email-contact-name-${index}`} className="sr-only">
                      Name
                    </Label>
                    <Input
                      id={`email-contact-name-${index}`}
                      placeholder="Name"
                      value={contact.name}
                      onChange={(e) => handleContactChange("email", index, "name", e.target.value)}
                      className="flex-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                    />
                    <Label htmlFor={`email-contact-email-${index}`} className="sr-only">
                      Email
                    </Label>
                    <div className="relative flex-1">
                      <Input
                        id={`email-contact-email-${index}`}
                        placeholder="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleContactChange("email", index, "email", e.target.value)}
                        className="rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] pl-8"
                      />
                      <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {emailContacts.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveContactLine("email", index)}>
                        <X className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-consent-checkbox"
                    checked={emailConsentChecked}
                    onCheckedChange={(checked) => setEmailConsentChecked(checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e66465] data-[state=checked]:to-[#9198e5]"
                  />
                  <Label htmlFor="email-consent-checkbox" className="text-sm text-gray-700">
                    I have the receiver's consent to send a message to this contact
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 shadow-sm rounded-md"
                    onClick={() => handleAddContactLine("email")}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add line
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                    onClick={() => handleSendReviewRequests("email")}
                    disabled={isSending || !emailConsentChecked || emailContacts.every((c) => !c.name && !c.email)}
                  >
                    {isSending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Request a review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Template */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex justify-center">
              <EmailPreview senderEmail={emailSenderEmail} subject={emailSubject} message={emailMessageTemplate} />
            </div>
            <Card className="flex-1 shadow-sm rounded-lg border border-gray-200/60">
              <CardHeader className="pb-4 flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">Edit Template</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Monitor className="w-4 h-4 mr-2" /> Customize the Review Link
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label
                    htmlFor="email-sender-email"
                    className="text-sm font-medium text-gray-700 flex items-center gap-1"
                  >
                    Customize the sender email
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Label>
                  <Input
                    id="email-sender-email"
                    type="email"
                    value={emailSenderEmail}
                    onChange={(e) => setEmailSenderEmail(e.target.value)}
                    className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="email-subject-template"
                    className="text-sm font-medium text-gray-700 flex items-center gap-1"
                  >
                    Customize the subject
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Label>
                  <Input
                    id="email-subject-template"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="email-message-template"
                    className="text-sm font-medium text-gray-700 flex items-center gap-1"
                  >
                    Customize the message
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Label>
                  <Textarea
                    id="email-message-template"
                    value={emailMessageTemplate}
                    onChange={(e) => setEmailMessageTemplate(e.target.value)}
                    className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] min-h-[120px]"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    onClick={() => insertIntoMessage("Company name", "emailTemplate", "message")}
                  >
                    Company name
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    onClick={() => insertIntoMessage("Name", "emailTemplate", "message")}
                  >
                    Name
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    onClick={() => insertIntoMessage("Your link", "emailTemplate", "message")}
                  >
                    Your link
                  </Button>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                  onClick={() => handleSaveTemplate("email_template")}
                  disabled={isSavingTemplate}
                >
                  {isSavingTemplate ? "Saving..." : "Save template"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Send an automatic Email reminder */}
          <Card className="shadow-sm rounded-lg border border-gray-200/60 mt-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Send an automatic Email reminder if the customer doesn&apos;t click on the review link.
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3 Days Reminder */}
              <Card className="shadow-sm rounded-lg border border-gray-200/60">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Trigger reminders after 3 days
                    </CardTitle>
                    <Switch
                      checked={emailReminder3DayEnabled}
                      onCheckedChange={setEmailReminder3DayEnabled}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e66465] data-[state=checked]:to-[#9198e5]"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label
                      htmlFor="email-reminder-3-subject"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Customize the subject
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </Label>
                    <Input
                      id="email-reminder-3-subject"
                      value={emailReminder3DaySubject}
                      onChange={(e) => setEmailReminder3DaySubject(e.target.value)}
                      className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="email-reminder-3-message"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Customize the message
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </Label>
                    <Textarea
                      id="email-reminder-3-message"
                      value={emailReminder3DayMessage}
                      onChange={(e) => setEmailReminder3DayMessage(e.target.value)}
                      className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Company name", "emailReminder3", "message")}
                    >
                      Company name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Name", "emailReminder3", "message")}
                    >
                      Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Your link", "emailReminder3", "message")}
                    >
                      Your link
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>
                      You are sending 2 messages. Please note that emojis and certain special characters may increase
                      the total message length.
                    </span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                    onClick={() => handleSaveTemplate("email_reminder_3")}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>

              {/* 7 Days Reminder */}
              <Card className="shadow-sm rounded-lg border border-gray-200/60">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Trigger reminders after 7 days
                    </CardTitle>
                    <Switch
                      checked={emailReminder7DayEnabled}
                      onCheckedChange={setEmailReminder7DayEnabled}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e66465] data-[state=checked]:to-[#9198e5]"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label
                      htmlFor="email-reminder-7-subject"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Customize the subject
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </Label>
                    <Input
                      id="email-reminder-7-subject"
                      value={emailReminder7DaySubject}
                      onChange={(e) => setEmailReminder7DaySubject(e.target.value)}
                      className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="email-reminder-7-message"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      Customize the message
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </Label>
                    <Textarea
                      id="email-reminder-7-message"
                      value={emailReminder7DayMessage}
                      onChange={(e) => setEmailReminder7DayMessage(e.target.value)}
                      className="mt-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Company name", "emailReminder7", "message")}
                    >
                      Company name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Name", "emailReminder7", "message")}
                    >
                      Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                      onClick={() => insertIntoMessage("Your link", "emailReminder7", "message")}
                    >
                      Your link
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>
                      You are sending 2 messages. Please note that emojis and certain special characters may increase
                      the total message length.
                    </span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white hover:from-[#d45a5b] hover:to-[#7a80d1] rounded-md shadow-sm"
                    onClick={() => handleSaveTemplate("email_reminder_7")}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-code" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm rounded-lg border border-gray-200/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800">Review Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    readOnly
                    value={reviewLink}
                    className="pr-10 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:bg-gray-100"
                    onClick={handleCopyReviewLink}
                  >
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copy link</span>
                  </Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="icon" onClick={handleGenerateQrCode}>
                    <QrCode className="h-4 w-4" />
                    <span className="sr-only">Generate QR Code</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShareLink}>
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share Link</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleOpenLink}>
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Open Link</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-lg border border-gray-200/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800">QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <img
                  src={`/placeholder.svg?height=200&width=200&query=QR Code for ${encodeURIComponent(reviewLink)}`}
                  alt="QR Code"
                  className="w-48 h-48 object-contain"
                />
                <Button
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-md shadow-sm"
                  onClick={handleDownloadQrCode}
                >
                  <Download className="w-4 h-4 mr-2" /> Download QR Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Requests Sent Section */}
      {activeSubTab !== "qr-code" && (
        <Card className="shadow-sm rounded-lg border border-gray-200/60 mt-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Requests Sent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search by name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="flex-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
              />
              <Input
                placeholder="Search by contact (email/phone)"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="flex-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5]"
              />
              <select
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="flex-1 rounded-md border-gray-300 focus:border-[#9198e5] focus:ring-[#9198e5] p-2"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
              <Button
                variant="outline"
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 shadow-sm rounded-md"
                onClick={handleExportRequests}
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message Content</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRequests ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading requests...
                      </TableCell>
                    </TableRow>
                  ) : sentRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No review requests sent yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.customer_name || "N/A"}</TableCell>
                        <TableCell>{request.customer_contact}</TableCell>
                        <TableCell>{request.contact_type.toUpperCase()}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.message_content}</TableCell>
                        <TableCell>{format(new Date(request.sent_at), "MMM dd, yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              request.status === "sent"
                                ? "bg-blue-100 text-blue-800"
                                : request.status === "clicked"
                                  ? "bg-green-100 text-green-800"
                                  : request.status === "reviewed"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
