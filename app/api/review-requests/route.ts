import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { ReviewRequest } from "@/types/db"

// Mock user ID for demonstration purposes. In a real app, get this from the session.
const MOCK_USER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" // Changed to a valid UUID

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const contactType = searchParams.get("contactType") // 'sms' or 'email'
    const dateFilter = searchParams.get("dateFilter") // 'All', 'Today', 'Last 7 Days', 'Last 30 Days'

    let dbQuery = supabase
      .from("review_requests")
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("sent_at", { ascending: false })

    if (contactType && contactType !== "all") {
      dbQuery = dbQuery.eq("contact_type", contactType)
    }

    if (query) {
      dbQuery = dbQuery.or(`customer_name.ilike.%${query}%,customer_contact.ilike.%${query}%`)
    }

    if (dateFilter && dateFilter !== "All") {
      const now = new Date()
      let startDate: Date | undefined

      if (dateFilter === "Today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (dateFilter === "Last 7 Days") {
        startDate = new Date(now.setDate(now.getDate() - 7))
      } else if (dateFilter === "Last 30 Days") {
        startDate = new Date(now.setMonth(now.getMonth() - 1))
      }

      if (startDate) {
        dbQuery = dbQuery.gte("sent_at", startDate.toISOString())
      }
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error("Error fetching review requests:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in GET /api/review-requests:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const requests = (await request.json()) as Omit<ReviewRequest, "id" | "user_id" | "sent_at" | "status">[]

    if (!requests || requests.length === 0) {
      return NextResponse.json({ success: false, error: "No review requests provided" }, { status: 400 })
    }

    const requestsToInsert = requests.map((req) => ({
      ...req,
      user_id: MOCK_USER_ID,
      status: "sent", // Default status
    }))

    const { data, error } = await supabase.from("review_requests").insert(requestsToInsert).select()

    if (error) {
      console.error("Error inserting review requests:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/review-requests:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
