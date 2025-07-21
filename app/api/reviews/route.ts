import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { Review } from "@/types/db"

// Mock user ID for demonstration purposes. In a real app, get this from the session.
const MOCK_USER_ID = "1"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rating = searchParams.get("rating")
    const platform = searchParams.get("platform")
    const query = searchParams.get("query")

    let dbQuery = supabase
      .from("reviews")
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("created_at", { ascending: false })

    if (rating && rating !== "all") {
      dbQuery = dbQuery.eq("rating", Number.parseInt(rating))
    }
    if (platform && platform !== "all") {
      dbQuery = dbQuery.ilike("platform", `%${platform}%`)
    }
    if (query) {
      dbQuery = dbQuery.or(`customer_name.ilike.%${query}%,comment.ilike.%${query}%,title.ilike.%${query}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in GET /api/reviews:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = (await request.json()) as { id: string; updates: Partial<Review> }

    if (!id || !updates) {
      return NextResponse.json({ success: false, error: "Review ID and updates are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .eq("user_id", MOCK_USER_ID) // Ensure user owns the review
      .select()
      .single()

    if (error) {
      console.error("Error updating review:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Review not found or not authorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in PUT /api/reviews:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = (await request.json()) as { id: string }

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("reviews").delete().eq("id", id).eq("user_id", MOCK_USER_ID) // Ensure user owns the review

    if (error) {
      console.error("Error deleting review:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/reviews:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
