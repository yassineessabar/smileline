"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, parseISO } from "date-fns"

interface ChartData {
  date: string
  views: number
  uniqueViews: number
  clicks: number
  uniqueClicks: number
  clickRate?: number
}

interface InsightsChartProps {
  data: ChartData[]
  activeTab: string
  showViews?: boolean
  showUniqueViews?: boolean
  showClicks?: boolean
  showUniqueClicks?: boolean
}

const CHART_COLORS = {
  views: "#2665d6",
  uniqueViews: "#02acc4", 
  clicks: "#D717E7",
  uniqueClicks: "#FC3E4B",
  clickRate: "#2665d6"
}

export function InsightsChart({ 
  data, 
  activeTab, 
  showViews = true,
  showUniqueViews = true,
  showClicks = true,
  showUniqueClicks = true
}: InsightsChartProps) {
  const formatXAxisTick = (tickItem: string) => {
    try {
      const date = parseISO(tickItem)
      return format(date, "MMM d")
    } catch {
      // Fallback for already formatted dates
      return tickItem
    }
  }

  const formatTooltipLabel = (label: string) => {
    try {
      const date = parseISO(label)
      return format(date, "EEE, MMM d, yyyy")
    } catch {
      return label
    }
  }

  const formatYAxis = (value: number) => {
    if (value === 0) return "0"
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {formatTooltipLabel(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
                {entry.name}: <span className="font-semibold text-gray-900">{entry.value}</span>
                {entry.dataKey === 'clickRate' && '%'}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Calculate dynamic Y-axis domain
  const getYAxisDomain = () => {
    if (!data || data.length === 0) return [0, 10]
    
    let maxValue = 0
    data.forEach(item => {
      if (activeTab === "views-clicks") {
        if (showViews) maxValue = Math.max(maxValue, item.views || 0)
        if (showUniqueViews) maxValue = Math.max(maxValue, item.uniqueViews || 0)
        if (showClicks) maxValue = Math.max(maxValue, item.clicks || 0)
        if (showUniqueClicks) maxValue = Math.max(maxValue, item.uniqueClicks || 0)
      } else if (activeTab === "click-rate") {
        maxValue = Math.max(maxValue, item.clickRate || 0)
      }
    })
    
    // If maxValue is 0, show a scale up to 10 for better visibility
    if (maxValue === 0) return [0, 10]
    
    // For very small values, ensure minimum scale
    if (maxValue < 5) return [0, 10]
    
    // Add some padding to the max value
    const paddedMax = Math.ceil(maxValue * 1.2)
    return [0, paddedMax]
  }

  const yAxisDomain = getYAxisDomain()
  
  // Check if we have valid data
  const hasValidData = data && data.length > 0

  if (activeTab === "click-rate") {
    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisTick}
              tick={{ fill: "#676B5F", fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "#676B5F", fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip 
              content={<CustomTooltip />}
              formatter={(value: any) => [`${value}%`, 'Click Rate']}
            />
            <Line
              type="monotone"
              dataKey="clickRate"
              stroke="#2665d6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#2665d6" }}
              name="Click Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Views and clicks chart
  return (
    <div className="w-full h-64 relative">
      <div className="absolute top-2 right-2 text-xs text-gray-500 z-10">
        Views: {data.reduce((sum, item) => sum + (item.views || 0), 0)} | 
        Clicks: {data.reduce((sum, item) => sum + (item.clicks || 0), 0)}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E5E7EB" 
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisTick}
            tick={{ fill: "#676B5F", fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            tick={{ fill: "#676B5F", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {showViews && (
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke="#2665d6" 
              strokeWidth={2} 
              dot={{ r: 4, fill: "#2665d6" }}
              name="Views"
            />
          )}
          
          {showUniqueViews && (
            <Line 
              type="monotone" 
              dataKey="uniqueViews" 
              stroke="#02acc4" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: "#02acc4" }}
              name="Unique Views"
            />
          )}
          
          {showClicks && (
            <Line 
              type="monotone" 
              dataKey="clicks" 
              stroke="#D717E7" 
              strokeWidth={2} 
              dot={{ r: 4, fill: "#D717E7" }}
              name="Clicks"
            />
          )}
          
          {showUniqueClicks && (
            <Line 
              type="monotone" 
              dataKey="uniqueClicks" 
              stroke="#FC3E4B" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: "#FC3E4B" }}
              name="Unique Clicks"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}