import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { Subscription } from "@/types/db"

const MOCK_USER_ID = "1"

export async function GET(request: NextRequest) {
  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions") // Assuming a table named 'subscriptions'
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .single()

    if (error) {
      console.error("Error fetching subscription:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    console.error("Error in GET /api/billing/subscription:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = (await request.json()) as Partial<Subscription>

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("user_id", MOCK_USER_ID)
      .select()
      .single()

    if (error) {
      console.error("Error updating subscription:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Subscription not found or not authorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in PUT /api/billing/subscription:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
