"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react" // Import useRef
import { useRouter } from "next/navigation"
import { Save, Edit3, X, Globe, User, Mail, Phone, Building, MapPin, Clock, Eye, Crown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserProfile, NotificationSettings } from "@/types/db"

export function AccountTab() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<UserProfile>({
    id: "1", // Mock ID
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    timezone: "",
    language: "",
    bio: "",
    avatar_url: "/placeholder.svg?height=80&width=80",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    user_id: "1", // Mock ID
    email_notifications: false,
    sms_notifications: false,
    review_alerts: false,
    weekly_reports: false,
    marketing_emails: false,
    notification_email: "", // Initialize new fields
    reply_email: "", // Initialize new fields
  })

  const [isEditingNotificationEmail, setIsEditingNotificationEmail] = useState(false)
  const [isEditingReplyEmail, setIsEditingReplyEmail] = useState(false)

  const [loading, setLoading] = useState(true)

  // Mock state for membership
  const [isPremium, setIsPremium] = useState(true)
  const [planName, setPlanName] = useState("Pro Plan")

  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for the hidden file input

  const fetchAccountData = useCallback(async () => {
    setLoading(true)
    try {
      const [profileRes, notificationRes] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/notifications"),
      ])

      const [profileData, notificationData] = await Promise.all([profileRes.json(), notificationRes.json()])

      if (profileData.success) {
        setProfileData({
          ...profileData.data,
          avatar_url: profileData.data.avatar_url || "/placeholder.svg?height=80&width=80",
        })
      } else {
        console.error("Error fetching profile:", profileData.error)
      }

      if (notificationData.success) {
        setNotificationSettings(notificationData.data)
      } else {
        console.error("Error fetching notification settings:", notificationData.error)
      }
      setIsPremium(true)
      setPlanName("Pro Plan")
    } catch (error) {
      console.error("Error fetching account data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccountData()
  }, [fetchAccountData])

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })
      const result = await response.json()
      if (result.success) {
        alert("Profile information saved successfully!")
        setIsEditing(false)
      } else {
        console.error("Error saving profile:", result.error)
        alert("Failed to save profile information.")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile information.")
    }
  }

  const handleSaveNotifications = async (field: "notification_email" | "reply_email" | "toggle") => {
    try {
      let updates: Partial<NotificationSettings> = {}
      if (field === "notification_email") {
        updates = { notification_email: notificationSettings.notification_email }
      } else if (field === "reply_email") {
        updates = { reply_email: notificationSettings.reply_email }
      } else if (field === "toggle") {
        updates = { email_notifications: notificationSettings.email_notifications }
      }

      const response = await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const result = await response.json()
      if (result.success) {
        alert("Notification preferences saved successfully!")
        if (field === "notification_email") setIsEditingNotificationEmail(false)
        if (field === "reply_email") setIsEditingReplyEmail(false)
      } else {
        console.error("Error saving notifications:", result.error)
        alert("Failed to save notification preferences.")
      }
    } catch (error) {
      console.error("Error saving notifications:", error)
      alert("Failed to save notification preferences.")
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    fetchAccountData() // Revert changes by refetching
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Here you would typically upload the file to a storage service
      // and then update the profileData.avatar_url with the new URL.
      // For now, let's just log the file and create a temporary URL.
      console.log("Selected file:", file)
      const tempUrl = URL.createObjectURL(file)
      setProfileData((prev) => ({ ...prev, avatar_url: tempUrl }))
      // Don't forget to revoke the object URL when it's no longer needed
      // URL.revokeObjectURL(tempUrl);
    }
  }

  const timezones = [
    "Europe/Paris",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
    "Asia/Tokyo",
    "Australia/Sydney",
  ]

  const languages = ["English", "French", "Spanish", "German", "Italian", "Portuguese"]

  const countries = ["France", "United Kingdom", "United States", "Germany", "Spain", "Italy", "Canada"]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#e66465] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <Card className="bg-white border border-gray-200/60 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Profile Information</CardTitle>
              <CardDescription className="text-gray-600">
                Manage your personal information and contact details
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`transition-all duration-150 ${
                isEditing
                  ? "text-red-600 border-red-200 hover:bg-red-50"
                  : "text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white text-xl font-medium">
                {profileData.first_name[0]}
                {profileData.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">
                {profileData.first_name} {profileData.last_name}
              </h3>
              <p className="text-sm text-gray-600">{profileData.email}</p>
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="sr-only" // Visually hide the input
                    accept="image/*" // Accept only image files
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
                    onClick={() => fileInputRef.current?.click()} // Trigger click on hidden input
                  >
                    Change Photo
                  </Button>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name
              </Label>
              <Input
                value={profileData.first_name}
                onChange={(e) => setProfileData((prev) => ({ ...prev, first_name: e.target.value }))}
                className="h-9 text-sm border-gray-200"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Last Name
              </Label>
              <Input
                value={profileData.last_name}
                onChange={(e) => setProfileData((prev) => ({ ...prev, last_name: e.target.value }))}
                className="h-9 text-sm border-gray-200"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                className="h-9 text-sm border-gray-200"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-9 text-sm border-gray-200"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company
              </Label>
              <Input
                value={profileData.company}
                onChange={(e) => setProfileData((prev) => ({ ...prev, company: e.target.value }))}
                className="h-9 text-sm border-gray-200"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Position</Label>
              <Input
                value={profileData.position}
                onChange={(e) => setProfileData((prev) => ({ ...prev, position: e.target.value }))}
                className="h-9 text-sm border-gray-200"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Address Information */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Street Address</Label>
                <Input
                  value={profileData.address}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                  className="h-9 text-sm border-gray-200"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">City</Label>
                <Input
                  value={profileData.city}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                  className="h-9 text-sm border-gray-200"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Postal Code</Label>
                <Input
                  value={profileData.postal_code}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, postal_code: e.target.value }))}
                  className="h-9 text-sm border-gray-200"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Country</Label>
                <Select
                  value={profileData.country}
                  onValueChange={(value) => setProfileData((prev) => ({ ...prev, country: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Preferences
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timezone
                </Label>
                <Select
                  value={profileData.timezone}
                  onValueChange={(value) => setProfileData((prev) => ({ ...prev, timezone: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Language</Label>
                <Select
                  value={profileData.language}
                  onValueChange={(value) => setProfileData((prev) => ({ ...prev, language: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                className="bg-gradient-to-r from-[#e66465] to-[#9198e5] hover:from-[#d55555] hover:to-[#8088d5] text-white"
                onClick={handleSaveProfile}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white border border-gray-200/60 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  Notifications <Eye className="w-4 h-4" />
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Update the email address where you receive daily notifications with new reviews or private feedback.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <Input
                type="email"
                placeholder="Email for notifications"
                value={notificationSettings.notification_email || ""}
                onChange={(e) => setNotificationSettings((prev) => ({ ...prev, notification_email: e.target.value }))}
                className="h-9 text-sm border-gray-200 flex-1"
                disabled={!isEditingNotificationEmail}
              />
              <Button
                variant="outline"
                size="sm"
                className={`transition-all duration-150 ${
                  isEditingNotificationEmail
                    ? "text-red-600 border-red-200 hover:bg-red-50"
                    : "text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => {
                  if (isEditingNotificationEmail) {
                    handleSaveNotifications("notification_email")
                  }
                  setIsEditingNotificationEmail(!isEditingNotificationEmail)
                }}
              >
                {isEditingNotificationEmail ? "Save" : "Edit"}
              </Button>
              <Switch
                checked={notificationSettings.email_notifications}
                onCheckedChange={(checked) => {
                  setNotificationSettings((prev) => ({ ...prev, email_notifications: checked }))
                  handleSaveNotifications("toggle")
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200/60 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Replies</CardTitle>
                <CardDescription className="text-gray-600">
                  Update the email address clients will use to respond to your review requests.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <Input
                type="email"
                placeholder="Email for replies"
                value={notificationSettings.reply_email || ""}
                onChange={(e) => setNotificationSettings((prev) => ({ ...prev, reply_email: e.target.value }))}
                className="h-9 text-sm border-gray-200 flex-1"
                disabled={!isEditingReplyEmail}
              />
              <Button
                variant="outline"
                size="sm"
                className={`transition-all duration-150 ${
                  isEditingReplyEmail
                    ? "text-red-600 border-red-200 hover:bg-red-50"
                    : "text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => {
                  if (isEditingReplyEmail) {
                    handleSaveNotifications("reply_email")
                  }
                  setIsEditingReplyEmail(!isEditingReplyEmail)
                }}
              >
                {isEditingReplyEmail ? "Save" : "Edit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manage Membership */}
      <Card className="bg-white border border-gray-200/60 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Manage Membership <Crown className="w-4 h-4 text-yellow-500" />
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isPremium ? `You are currently on the ${planName}.` : "Upgrade your plan to unlock more features."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isPremium ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-gradient-to-r from-[#e66465] to-[#9198e5] hover:from-[#d55555] hover:to-[#8088d5] text-white"
                onClick={() => router.push("/upgrade-page")}
              >
                Change Plan
              </Button>
              <Button variant="outline" onClick={() => alert("Cancel Plan clicked!")}>
                Cancel Plan
              </Button>
            </div>
          ) : (
            <Button
              className="bg-gradient-to-r from-[#e66465] to-[#9198e5] hover:from-[#d55555] hover:to-[#8088d5] text-white"
              onClick={() => alert("Upgrade clicked!")}
            >
              Upgrade Now
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
