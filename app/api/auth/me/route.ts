import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"
import { authCache } from "@/lib/auth-cache"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me: Starting auth check')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    console.log('🔍 /api/auth/me: Session token exists:', !!sessionToken)

    if (!sessionToken) {
      console.log('🔍 /api/auth/me: No session token, returning 401')
      return NextResponse.json({ success: false, error: "No session token found" }, { status: 401 })
    }

    // Check cache first
    const cacheKey = `auth:${sessionToken}`
    const cachedUser = authCache.get(cacheKey)
    console.log('🔍 /api/auth/me: Cache hit:', !!cachedUser)
    
    if (cachedUser) {
      console.log('🔍 /api/auth/me: Returning cached user')
      return NextResponse.json({
        success: true,
        user: cachedUser,
      })
    }

    // Find session in Supabase
    console.log('🔍 /api/auth/me: Querying user_sessions table')
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at") // Select only necessary fields
      .eq("session_token", sessionToken)
      .single()

    console.log('🔍 /api/auth/me: Session query result:', { session, sessionError })

    if (sessionError || !session) {
      console.log('🔍 /api/auth/me: No valid session found')
      // Clear invalid session cookie
      cookieStore.delete("session")
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Clear expired session cookie and delete from DB
      cookieStore.delete("session")
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 })
    }

    // Now, fetch the user data using the user_id from the valid session
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", session.user_id).single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User data not found" }, { status: 404 })
    }

    // Return user data
    if (!user) {
      return NextResponse.json({ success: false, error: "User data not found" }, { status: 404 })
    }

    const userData = {
      id: user.id,
      email: user.email,
      company: user.company,
      phone: user.phone,
      profile_picture_url: user.profile_picture_url,
      bio: user.bio,
      subscription_type: user.subscription_type || 'free',
      subscription_status: user.subscription_status || 'inactive',
      stripe_customer_id: user.stripe_customer_id,
      trial_end_date: user.trial_end_date,
      subscription_end_date: user.subscription_end_date,
    }

    // Cache the user data
    authCache.set(cacheKey, userData)

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("❌ Error in /api/auth/me:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
