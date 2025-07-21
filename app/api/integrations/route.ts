import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const MOCK_USER_ID = "1"

export async function GET(request: NextRequest) {
  try {
    const { data: integrations, error } = await supabase
      .from("integrations") // Assuming a table named 'integrations'
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching integrations:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: integrations })
  } catch (error) {
    console.error("Error in GET /api/integrations:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
