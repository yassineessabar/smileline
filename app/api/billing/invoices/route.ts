import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const MOCK_USER_ID = "1"

export async function GET(request: NextRequest) {
  try {
    const { data: invoices, error } = await supabase
      .from("invoices") // Assuming a table named 'invoices'
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("issue_date", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    console.error("Error in GET /api/billing/invoices:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
