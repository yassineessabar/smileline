import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return null
    }

    const { data: session, error } = await supabase
      .from("user_sessions")
      .select("user_id")
      .eq("session_token", sessionToken)
      .single()

    if (error || !session) {
      return null
    }

    return session.user_id
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { data: reviewLink, error } = await supabase
      .from("review_link")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching review link:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!reviewLink) {
      return NextResponse.json({ success: false, error: "Review link not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: reviewLink })
  } catch (error) {
    console.error("Error in GET /api/review-link:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const updates = await request.json()

    // Remove fields that shouldn't be updated by users
    const { id, user_id, review_url, review_qr_code, created_at, updated_at, ...allowedUpdates } = updates

    const { data, error } = await supabase
      .from("review_link")
      .update(allowedUpdates)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating review link:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Review link not found or not authorized" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in PUT /api/review-link:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Regenerate review URL (useful if user wants a new URL)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { action } = await request.json()

    if (action !== "regenerate_url") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Call the generate function and update the review_url
    const { data, error } = await supabase.rpc('generate_unique_review_url')
    
    if (error) {
      console.error("Error generating new URL:", error)
      return NextResponse.json({ success: false, error: "Failed to generate new URL" }, { status: 500 })
    }

    const newUrl = data

    const { data: updatedLink, error: updateError } = await supabase
      .from("review_link")
      .update({ review_url: newUrl })
      .eq("user_id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating review URL:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedLink })
  } catch (error) {
    console.error("Error in POST /api/review-link:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}