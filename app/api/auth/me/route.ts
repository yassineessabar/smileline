import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "No session token found" }, { status: 401 })
    }

    // Find session in Supabase
    // First, select only the session data
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at") // Select only necessary fields
      .eq("session_token", sessionToken)
      .single()

    if (sessionError || !session) {
      console.log("❌ Session not found or expired:", sessionError?.message)
      // Clear invalid session cookie
      cookieStore.delete("session")
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      console.log("❌ Session expired for user_id:", session.user_id)
      // Clear expired session cookie and delete from DB
      cookieStore.delete("session")
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 })
    }

    // Now, fetch the user data using the user_id from the valid session
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", session.user_id).single()

    if (userError || !user) {
      console.log("❌ User data not found for session:", userError?.message)
      return NextResponse.json({ success: false, error: "User data not found" }, { status: 404 })
    }

    // Return user data
    if (!user) {
      console.log("❌ User data not found for session:", session.id)
      return NextResponse.json({ success: false, error: "User data not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        position: user.position,
        phone_number: user.phone_number,
      },
    })
  } catch (error) {
    console.error("❌ Error in /api/auth/me:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
