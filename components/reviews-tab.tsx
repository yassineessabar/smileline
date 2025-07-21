"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Star,
  MoreHorizontal,
  Reply,
  Flag,
  Trash2,
  ExternalLink,
  Calendar,
  ChevronDown,
  MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Review } from "@/types/db" // Import the Review type

export function ReviewsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRating, setFilterRating] = useState("all")
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [dateRange, setDateRange] = useState("Last 30 days")
  const [flaggedReviews, setFlaggedReviews] = useState<string[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const dateOptions = ["Last 7 days", "Last 30 days", "Last 90 days", "Last year", "Custom range"]

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterRating !== "all") params.append("rating", filterRating)
      if (filterPlatform !== "all") params.append("platform", filterPlatform)
      if (searchQuery) params.append("query", searchQuery)

      const response = await fetch(`/api/reviews?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setReviews(result.data || [])
      } else {
        console.error("Error fetching reviews:", result.error)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterRating, filterPlatform])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "flagged":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "google":
        return "bg-blue-100 text-blue-800"
      case "trustpilot":
        return "bg-green-100 text-green-800"
      case "facebook":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleFlagReview = async (reviewId: string, currentStatus: string) => {
    const newStatus = currentStatus === "flagged" ? "published" : "flagged"
    try {
      const response = await fetch(`/api/reviews`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, updates: { status: newStatus } }),
      })
      const result = await response.json()

      if (result.success) {
        setReviews((prev) => prev.map((review) => (review.id === reviewId ? { ...review, status: newStatus } : review)))
        alert(`Review ${newStatus === "flagged" ? "flagged" : "unflagged"} successfully!`)
      } else {
        console.error("Error flagging review:", result.error)
        alert(`Failed to ${newStatus === "flagged" ? "flag" : "unflag"} review.`)
      }
    } catch (error) {
      console.error("Error flagging review:", error)
      alert(`Failed to ${newStatus === "flagged" ? "flag" : "unflag"} review.`)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/reviews`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId }),
      })
      const result = await response.json()

      if (result.success) {
        setReviews((prev) => prev.filter((review) => review.id !== reviewId))
        alert("Review deleted successfully!")
      } else {
        console.error("Error deleting review:", result.error)
        alert("Failed to delete review.")
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      alert("Failed to delete review.")
    }
  }

  const handleReplyToReview = async (reviewId: string, customerName: string) => {
    const responseText = prompt(`Reply to ${customerName}'s review:`)
    if (responseText) {
      try {
        const response = await fetch(`/api/reviews`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: reviewId, updates: { response: responseText } }),
        })
        const result = await response.json()

        if (result.success) {
          setReviews((prev) =>
            prev.map((review) => (review.id === reviewId ? { ...review, response: responseText } : review)),
          )
          alert(`Reply sent to ${customerName}: "${responseText}"`)
        } else {
          console.error("Error sending reply:", result.error)
          alert("Failed to send reply.")
        }
      } catch (error) {
        console.error("Error sending reply:", error)
        alert("Failed to send reply.")
      }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
          <p className="text-gray-600">Manage and respond to customer reviews</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                <Calendar className="w-3 h-3 mr-1" />
                {dateRange}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Select Period</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dateOptions.map((option) => (
                <DropdownMenuItem key={option} onClick={() => setDateRange(option)} className="text-xs">
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-gradient-to-r from-[#e66465] to-[#9198e5] hover:from-[#d55555] hover:to-[#8088d5] text-white h-8 text-xs"
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                "Customer,Email,Rating,Title,Comment,Date,Platform,Status,Helpful,Verified\n" +
                reviews // Use the full reviews list for export, not just filtered
                  .map(
                    (review) =>
                      `"${review.customer_name}","${review.customer_email}",${review.rating},"${review.title}","${review.comment}","${formatDate(review.created_at)}","${review.platform}","${review.status}",${review.helpful_count},${review.verified}`,
                  )
                  .join("\n")

              const encodedUri = encodeURI(csvContent)
              const link = document.createElement("a")
              link.setAttribute("href", encodedUri)
              link.setAttribute("download", `all_reviews_${new Date().toISOString().split("T")[0]}.csv`)
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              alert(`${reviews.length} reviews exported successfully!`)
            }}
          >
            Export Reviews
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search reviews, customers, or comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm border-gray-200"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-32 h-9 text-sm border-gray-200">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-32 h-9 text-sm border-gray-200">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="trustpilot">Trustpilot</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews
          .filter((review) => {
            const matchesSearch =
              review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
              review.title.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesRating = filterRating === "all" || review.rating.toString() === filterRating
            const matchesPlatform =
              filterPlatform === "all" || review.platform.toLowerCase() === filterPlatform.toLowerCase()
            return matchesSearch && matchesRating && matchesPlatform
          })
          .map((review) => (
            <Card
              key={review.id}
              className="bg-white border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                      <AvatarFallback className="bg-gradient-to-r from-[#e66465] to-[#9198e5] text-white text-sm font-medium">
                        {review.customer_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{review.customer_name}</h3>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{review.customer_email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPlatformColor(review.platform)}>{review.platform}</Badge>
                    <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                    {review.status === "flagged" && <Badge className="bg-red-100 text-red-800">Flagged</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReplyToReview(review.id, review.customer_name)}>
                          <Reply className="w-4 h-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const platformUrls = {
                              Google: "https://business.google.com/reviews",
                              Trustpilot: "https://business.trustpilot.com/reviews",
                              Facebook: "https://www.facebook.com/page/reviews",
                            }
                            window.open(platformUrls[review.platform as keyof typeof platformUrls] || "#", "_blank")
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Platform
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleFlagReview(review.id, review.status)}>
                          <Flag className="w-4 h-4 mr-2" />
                          {review.status === "flagged" ? "Unflag Review" : "Flag Review"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteReview(review.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  </div>

                  {review.response && (
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gradient-to-r from-[#e66465] to-[#9198e5]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-[#e66465] to-[#9198e5] rounded-full flex items-center justify-center">
                          <Reply className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Your Response</span>
                      </div>
                      <p className="text-sm text-gray-700">{review.response}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{review.helpful_count} people found this helpful</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!review.response && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-gray-200 bg-transparent"
                          onClick={() => handleReplyToReview(review.id, review.customer_name)}
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs border-gray-200 bg-transparent">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {reviews.filter((review) => {
        const matchesSearch =
          review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRating = filterRating === "all" || review.rating.toString() === filterRating
        const matchesPlatform =
          filterPlatform === "all" || review.platform.toLowerCase() === filterPlatform.toLowerCase()
        return matchesSearch && matchesRating && matchesPlatform
      }).length === 0 && (
        <Card className="bg-white border border-gray-200/60 shadow-sm">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
