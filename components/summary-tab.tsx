"use client"

import { TrendingUp, TrendingDown, Star, MessageSquare, Users, Calendar, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

export function SummaryTab() {
  const [dateRange, setDateRange] = useState("Last 30 days")

  const dateOptions = ["Last 7 days", "Last 30 days", "Last 90 days", "Last year", "Custom range"]

  const stats = [
    {
      title: "Total Reviews",
      value: "1,234",
      change: "+12%",
      trend: "up",
      icon: MessageSquare,
      color: "text-pink-600",
    },
    {
      title: "Average Rating",
      value: "4.8",
      change: "+0.2",
      trend: "up",
      icon: Star,
      color: "text-orange-500",
    },
    {
      title: "Response Rate",
      value: "89%",
      change: "+5%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Active Customers",
      value: "2,847",
      change: "-3%",
      trend: "down",
      icon: Users,
      color: "text-blue-600",
    },
  ]

  const recentReviews = [
    {
      id: 1,
      customer: "Sarah Johnson",
      rating: 5,
      comment: "Excellent service and fast delivery!",
      date: "2 hours ago",
      platform: "Google",
    },
    {
      id: 2,
      customer: "Mike Chen",
      rating: 4,
      comment: "Good quality products, will order again.",
      date: "5 hours ago",
      platform: "Trustpilot",
    },
    {
      id: 3,
      customer: "Emma Wilson",
      rating: 5,
      comment: "Amazing customer support team!",
      date: "1 day ago",
      platform: "Facebook",
    },
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="space-y-8">
      {/* Header with Date Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Good morning, John! 👋</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your reviews</p>
        </div>
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className="bg-white border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span
                        className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-r from-[#e66465] to-[#9198e5]`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Review Trends Chart */}
        <Card className="bg-white border border-gray-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Review Trends</CardTitle>
            <CardDescription>Reviews received over time ({dateRange})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <div className="flex items-end justify-between h-full px-4 pb-4">
                {/* Dynamic chart bars based on date range */}
                {(() => {
                  const getChartData = () => {
                    switch (dateRange) {
                      case "Last 7 days":
                        return [
                          { period: "Mon", reviews: 12, height: "20%" },
                          { period: "Tue", reviews: 19, height: "32%" },
                          { period: "Wed", reviews: 8, height: "13%" },
                          { period: "Thu", reviews: 25, height: "42%" },
                          { period: "Fri", reviews: 34, height: "57%" },
                          { period: "Sat", reviews: 45, height: "75%" },
                          { period: "Sun", reviews: 38, height: "63%" },
                        ]
                      case "Last 90 days":
                        return [
                          { period: "Apr", reviews: 234, height: "35%" },
                          { period: "May", reviews: 312, height: "47%" },
                          { period: "Jun", reviews: 445, height: "67%" },
                          { period: "Jul", reviews: 523, height: "79%" },
                          { period: "Aug", reviews: 612, height: "92%" },
                          { period: "Sep", reviews: 678, height: "100%" },
                          { period: "Oct", reviews: 589, height: "87%" },
                        ]
                      case "Last year":
                        return [
                          { period: "Q1", reviews: 1234, height: "45%" },
                          { period: "Q2", reviews: 1567, height: "57%" },
                          { period: "Q3", reviews: 1890, height: "69%" },
                          { period: "Q4", reviews: 2234, height: "82%" },
                          { period: "Q1", reviews: 2456, height: "90%" },
                          { period: "Q2", reviews: 2678, height: "98%" },
                          { period: "Q3", reviews: 2734, height: "100%" },
                        ]
                      default: // Last 30 days
                        return [
                          { period: "Week 1", reviews: 45, height: "30%" },
                          { period: "Week 2", reviews: 52, height: "35%" },
                          { period: "Week 3", reviews: 38, height: "25%" },
                          { period: "Week 4", reviews: 71, height: "48%" },
                        ]
                    }
                  }

                  return getChartData().map((data, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 mx-1">
                      <div className="relative w-full flex items-end justify-center mb-2">
                        <div
                          className="w-full bg-gradient-to-t from-[#e66465] to-[#9198e5] rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                          style={{ height: data.height }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {data.reviews} reviews
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{data.period}</span>
                    </div>
                  ))
                })()}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
                <span>0</span>
                <span>{dateRange === "Last year" ? "1K" : dateRange === "Last 90 days" ? "300" : "25"}</span>
                <span>{dateRange === "Last year" ? "2K" : dateRange === "Last 90 days" ? "600" : "50"}</span>
                <span>{dateRange === "Last year" ? "3K+" : dateRange === "Last 90 days" ? "700+" : "75+"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="bg-white border border-gray-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Rating Distribution</CardTitle>
            <CardDescription>Breakdown of review ratings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <Progress
                  value={rating === 5 ? 65 : rating === 4 ? 25 : rating === 3 ? 8 : rating === 2 ? 2 : 0}
                  className="flex-1 h-2"
                />
                <span className="text-sm text-gray-600 w-12 text-right">
                  {rating === 5 ? "65%" : rating === 4 ? "25%" : rating === 3 ? "8%" : rating === 2 ? "2%" : "0%"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card className="bg-white border border-gray-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Reviews</CardTitle>
            <CardDescription>Latest customer feedback</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                "Customer,Rating,Comment,Date,Platform\n" +
                recentReviews
                  .map(
                    (review) =>
                      `"${review.customer}",${review.rating},"${review.comment}","${review.date}","${review.platform}"`,
                  )
                  .join("\n")

              const encodedUri = encodeURI(csvContent)
              const link = document.createElement("a")
              link.setAttribute("href", encodedUri)
              link.setAttribute("download", `reviews_${dateRange.toLowerCase().replace(/\s+/g, "_")}.csv`)
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              alert("Reviews exported successfully!")
            }}
          >
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-[#e66465] to-[#9198e5] rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {review.customer
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{review.customer}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {review.platform}
                      </Badge>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">{renderStars(review.rating)}</div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
