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

// GET - Fetch campaign configurations
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }


    // Fetch email template (ignore errors if table doesn't exist or no data)
    const { data: emailTemplate } = await supabase
      .from("email_templates")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(res => res)
      .catch(() => ({ data: null }))

    // Fetch SMS template (ignore errors if table doesn't exist or no data)
    const { data: smsTemplate } = await supabase
      .from("sms_templates")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(res => res)
      .catch(() => ({ data: null }))

    // Fetch campaign settings (ignore errors if table doesn't exist or no data)
    const { data: campaignSettings } = await supabase
      .from("campaign_settings")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(res => res)
      .catch(() => ({ data: null }))

    // It's okay if templates don't exist yet, we'll create defaults
    const emailData = emailTemplate || {
      user_id: userId,
      subject: "🌟 How was your experience with us?",
      content: "Hi [Name]! 👋\n\nWe hope you loved your recent experience with [Company]! Your opinion means the world to us and helps other customers discover what makes us special.\n\nWould you mind taking just 30 seconds to share your thoughts? Your review helps us grow and improve.\n\n✨ Share your experience: [reviewUrl]\n\nThank you for being an amazing customer!\n\nWith gratitude,\nThe [Company] Team 💙",
      from_email: "hello@yourbusiness.com",
      sequence: JSON.stringify([
        {
          id: "1",
          type: "email",
          isOpen: true,
          subject: "🌟 How was your experience with us?",
          content: "Hi [Name]! 👋\n\nWe hope you loved your recent experience with [Company]! Your opinion means the world to us and helps other customers discover what makes us special.\n\nWould you mind taking just 30 seconds to share your thoughts? Your review helps us grow and improve.\n\n✨ Share your experience: [reviewUrl]\n\nThank you for being an amazing customer!\n\nWith gratitude,\nThe [Company] Team 💙"
        },
        {
          id: "branch-1",
          type: "branch",
          isOpen: true,
          content: "Add a follow-up sequence?",
          branchDecision: "no"
        }
      ]),
      initial_trigger: "immediate",
      initial_wait_days: 3
    }

    const smsData = smsTemplate || {
      user_id: userId,
      content: "Hi [Name],\nthanks for choosing [Company]. We ask you to leave us a review.\n\nYour link: [reviewUrl]",
      sender_name: "Your Company",
      sequence: JSON.stringify([
        {
          id: "1",
          type: "sms",
          isOpen: true,
          content: "Hi [Name],\nthanks for choosing [Company]. We ask you to leave us a review.\n\nYour link: [reviewUrl]"
        },
        {
          id: "branch-1",
          type: "branch",
          isOpen: true,
          content: "Add a follow-up sequence?",
          branchDecision: "no"
        }
      ]),
      initial_trigger: "immediate",
      initial_wait_days: 3
    }

    const campaignData = campaignSettings || {
      user_id: userId,
      automation_enabled: false,
      email_enabled: true,
      sms_enabled: true
    }


    return NextResponse.json({ 
      success: true, 
      data: {
        email: emailData,
        sms: smsData,
        settings: campaignData
      }
    })
  } catch (error) {
    console.error("❌ Error fetching campaign data:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST - Save campaign configurations
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    console.log(`📨 Saving ${type} template for user ${userId}:`, data)

    if (type === "email") {
      // Upsert email template
      const emailData = {
        user_id: userId,
        name: data.name || "Default Email Template",
        subject: data.subject,
        content: data.content,
        from_email: data.fromEmail,
        sequence: JSON.stringify(data.sequence || []),
        initial_trigger: data.initialTrigger || "immediate",
        initial_wait_days: data.initialWaitDays || 3,
        updated_at: new Date().toISOString()
      }
      
      console.log(`📧 Email data to save:`, emailData)
      
      const { data: emailResult, error: emailError } = await supabase
        .from("email_templates")
        .upsert(emailData, {
          onConflict: "user_id"
        })
        .select()
        .single()

      console.log(`📧 Email save result:`, { emailResult, emailError })

      if (emailError) {
        console.error("❌ Error saving email template:", emailError)
        return NextResponse.json({ success: false, error: emailError.message }, { status: 500 })
      }

      console.log("✅ Email template saved successfully to database")


      // Trigger automation for existing customers when email template is updated
      try {
        console.log(`📧 Email template saved, triggering automation for user: ${userId}`)
        await triggerAutomationForExistingCustomers(userId, 'email', data.initialTrigger, data.initialWaitDays)
      } catch (automationError) {
        console.error('❌ Error triggering automation for email template update:', automationError)
        // Don't fail the template save if automation fails
      }

      return NextResponse.json({ success: true, data: emailResult })

    } else if (type === "sms") {
      // Upsert SMS template
      const smsData = {
        user_id: userId,
        name: data.name || "Default SMS Template",
        content: data.content,
        sender_name: data.senderName,
        sequence: JSON.stringify(data.sequence || []),
        initial_trigger: data.initialTrigger || "immediate",
        initial_wait_days: data.initialWaitDays || 3,
        updated_at: new Date().toISOString()
      }
      
      console.log(`📱 SMS data to save:`, smsData)
      
      const { data: smsResult, error: smsError } = await supabase
        .from("sms_templates")
        .upsert(smsData, {
          onConflict: "user_id"
        })
        .select()
        .single()

      console.log(`📱 SMS save result:`, { smsResult, smsError })

      if (smsError) {
        console.error("❌ Error saving SMS template:", smsError)
        return NextResponse.json({ success: false, error: smsError.message }, { status: 500 })
      }

      console.log("✅ SMS template saved successfully to database")


      // Trigger automation for existing customers when SMS template is updated
      try {
        console.log(`📱 SMS template saved, triggering automation for user: ${userId}`)
        await triggerAutomationForExistingCustomers(userId, 'sms', data.initialTrigger, data.initialWaitDays)
      } catch (automationError) {
        console.error('❌ Error triggering automation for SMS template update:', automationError)
        // Don't fail the template save if automation fails
      }

      return NextResponse.json({ success: true, data: smsResult })

    } else if (type === "settings") {
      // Upsert campaign settings
      const { data: settingsResult, error: settingsError } = await supabase
        .from("campaign_settings")
        .upsert({
          user_id: userId,
          automation_enabled: data.automationEnabled || false,
          email_enabled: data.emailEnabled || true,
          sms_enabled: data.smsEnabled || true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        })
        .select()
        .single()

      if (settingsError) {
        console.error("❌ Error saving campaign settings:", settingsError)
        return NextResponse.json({ success: false, error: settingsError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: settingsResult })
    } else {
      return NextResponse.json({ success: false, error: "Invalid campaign type" }, { status: 400 })
    }

  } catch (error) {
    console.error("❌ Error saving campaign data:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Trigger automation for existing customers when templates are updated
 */
async function triggerAutomationForExistingCustomers(
  userId: string, 
  templateType: 'email' | 'sms', 
  initialTrigger: string, 
  initialWaitDays: number
) {
  console.log(`🔄 Triggering ${templateType} automation for existing customers of user: ${userId}`)
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Get recent reviews for this user (last 30 days) that don't have pending automation jobs
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("id, customer_id, customer_name, customer_email, rating, created_at")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50) // Limit to 50 most recent reviews
    
    if (reviewsError) {
      console.error("Error fetching recent reviews:", reviewsError)
      return
    }
    
    if (!recentReviews || recentReviews.length === 0) {
      console.log("ℹ️ No recent reviews found to trigger automation for")
      return
    }
    
    console.log(`📋 Found ${recentReviews.length} recent review(s) for automation`)
    
    let scheduledCount = 0
    
    for (const review of recentReviews) {
      try {
        // Check if there's already a pending automation job for this review and template type
        const { data: existingJob } = await supabase
          .from("automation_jobs")
          .select("id")
          .eq("user_id", userId)
          .eq("review_id", review.id)
          .eq("template_type", templateType)
          .eq("status", "pending")
          .single()
        
        if (existingJob) {
          console.log(`⏭️ Skipping review ${review.id} - automation already scheduled`)
          continue
        }
        
        // Schedule new automation for this review
        const schedulerResponse = await fetch(`${baseUrl}/api/automation/scheduler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reviewId: review.id
          })
        })
        
        if (schedulerResponse.ok) {
          const result = await schedulerResponse.json()
          if (result.success && result.data.processedJobs > 0) {
            scheduledCount++
            console.log(`✅ Scheduled automation for review ${review.id}`)
          }
        } else {
          console.error(`❌ Failed to schedule automation for review ${review.id}:`, await schedulerResponse.text())
        }
        
      } catch (reviewError) {
        console.error(`❌ Error processing review ${review.id}:`, reviewError)
        continue
      }
    }
    
    console.log(`🎉 Successfully scheduled ${templateType} automation for ${scheduledCount} review(s)`)
    
    // If initial_trigger is immediate, also process the jobs immediately
    if (initialTrigger === 'immediate' && scheduledCount > 0) {
      console.log(`⚡ Processing immediate ${templateType} automation jobs...`)
      
      const processResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=false`)
      
      if (processResponse.ok) {
        const processResult = await processResponse.json()
        console.log(`✅ Processed ${processResult.data?.processedJobs || 0} immediate automation job(s)`)
      } else {
        console.error('❌ Failed to process immediate automation jobs:', await processResponse.text())
      }
    }
    
  } catch (error) {
    console.error(`❌ Error triggering automation for existing customers:`, error)
  }
}