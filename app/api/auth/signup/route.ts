import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name, company, title, phone } = body

    console.log("📝 Signup attempt for:", email)

    // Validate input
    if (!email || !password || !first_name) {
      return NextResponse.json({ success: false, error: "Email, password, and first name are required" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim()) // Ensure email is normalized
      .maybeSingle() // Use maybeSingle to handle no results gracefully

    if (checkError) {
      console.error("❌ Database error checking existing user:", checkError.message)
      return NextResponse.json({ success: false, error: "Database error during signup" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists with this email" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create new user in Supabase
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase().trim(), // Store normalized email
        password_hash: passwordHash,
        first_name: first_name.trim(),
        last_name: last_name?.trim() || "",
        company: company?.trim() || "",
        position: title?.trim() || "",
        phone_number: phone?.trim() || "",
      })
      .select()
      .single() // Use single() here as we expect exactly one new user

    if (userError || !newUser) {
      console.error("❌ User creation error:", userError?.message)
      return NextResponse.json({ success: false, error: "Failed to create user account" }, { status: 500 })
    }

    // Create session token
    const sessionToken = `session_${newUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store session in Supabase
    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: newUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("❌ Session creation error:", sessionError.message)
      return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
    }

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("✅ Signup successful for:", email)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        company: newUser.company,
        position: newUser.position,
        phone_number: newUser.phone_number,
      },
    })
  } catch (error) {
    console.error("❌ Signup error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
