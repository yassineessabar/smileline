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

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Complete save onboarding: Starting request')
    const userId = await getUserIdFromSession()
    
    if (!userId) {
      console.log('📥 Complete save onboarding: Authentication failed')
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    console.log('📥 Complete save onboarding: Received data for user:', userId)
    console.log('📥 Complete save onboarding: Full body:', JSON.stringify(body, null, 2))

    const { 
      companyName, 
      companyProfile, 
      businessCategory, 
      selectedPlatforms, 
      platformLinks,
      selectedTemplate 
    } = body

    // 1. Update users table with all available fields
    const userUpdateData: any = {
      updated_at: new Date().toISOString()
    }

    // Add all fields that might exist in users table
    if (companyName || companyProfile?.displayName) {
      userUpdateData.company = companyName || companyProfile?.displayName
    }
    
    if (businessCategory?.category) {
      userUpdateData.store_type = businessCategory.category
      userUpdateData.business_category = businessCategory.category
    }
    
    if (businessCategory?.description) {
      userUpdateData.business_description = businessCategory.description
    }
    
    if (selectedPlatforms && selectedPlatforms.length > 0) {
      userUpdateData.selected_platforms = selectedPlatforms
    }
    
    if (platformLinks && Object.keys(platformLinks).length > 0) {
      userUpdateData.platform_links = platformLinks
    }
    
    if (companyProfile?.bio) {
      userUpdateData.bio = companyProfile.bio
    }
    
    if (companyProfile?.displayName) {
      userUpdateData.display_name = companyProfile.displayName
    }
    
    if (selectedTemplate) {
      userUpdateData.selected_template = selectedTemplate
    }

    console.log('📥 User update data:', JSON.stringify(userUpdateData, null, 2))

    // Try to update users table (some fields might not exist)
    const { data: userUpdateResult, error: userUpdateError } = await supabase
      .from("users")
      .update(userUpdateData)
      .eq("id", userId)
      .select()
      .single()

    if (userUpdateError) {
      console.error("⚠️ Error updating user (some fields might not exist):", userUpdateError)
      
      // Try again with only basic fields
      const basicUpdateData = {
        company: userUpdateData.company,
        store_type: userUpdateData.store_type,
        updated_at: userUpdateData.updated_at
      }
      
      console.log('📥 Retrying with basic fields:', basicUpdateData)
      
      const { data: basicUpdate, error: basicError } = await supabase
        .from("users")
        .update(basicUpdateData)
        .eq("id", userId)
        .select()
        .single()
        
      if (basicError) {
        console.error("❌ Error updating basic user fields:", basicError)
      } else {
        console.log("✅ Basic user fields updated:", basicUpdate)
      }
    } else {
      console.log("✅ User table updated successfully:", userUpdateResult)
    }

    // 2. Save to dedicated onboarding_data table (if it exists)
    const onboardingData = {
      user_id: userId,
      company_name: companyName || companyProfile?.displayName,
      business_category: businessCategory?.category,
      business_description: businessCategory?.description,
      selected_platforms: selectedPlatforms || [],
      platform_links: platformLinks || {},
      display_name: companyProfile?.displayName,
      bio: companyProfile?.bio,
      selected_template: selectedTemplate,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📥 Onboarding data to save:', JSON.stringify(onboardingData, null, 2))

    // Try to upsert into onboarding_data table
    const { data: onboardingResult, error: onboardingError } = await supabase
      .from("onboarding_data")
      .upsert(onboardingData, {
        onConflict: 'user_id'
      })
      .select()

    if (onboardingError) {
      console.log("⚠️ Onboarding data table might not exist:", onboardingError.message)
    } else {
      console.log("✅ Onboarding data saved:", onboardingResult)
    }

    // 3. Update review_link with platforms and links
    console.log('📥 Updating review_link with platforms and links...')
    console.log('📥 Platform links to save:', platformLinks)
    
    if (selectedPlatforms && selectedPlatforms.length > 0) {
      const reviewLinkUpdate = {
        enabled_platforms: selectedPlatforms,
        company_name: companyName || companyProfile?.displayName || 'My Company',
        updated_at: new Date().toISOString()
      }

      // Add ALL platform links (handle case variations)
      if (platformLinks) {
        // Google
        if (platformLinks.google || platformLinks.Google) {
          reviewLinkUpdate.google_review_link = platformLinks.google || platformLinks.Google
          console.log('📥 Setting Google link:', reviewLinkUpdate.google_review_link)
        }
        
        // Facebook
        if (platformLinks.facebook || platformLinks.Facebook) {
          reviewLinkUpdate.facebook_review_link = platformLinks.facebook || platformLinks.Facebook
          console.log('📥 Setting Facebook link:', reviewLinkUpdate.facebook_review_link)
        }
        
        // Trustpilot
        if (platformLinks.trustpilot || platformLinks.Trustpilot) {
          reviewLinkUpdate.trustpilot_review_link = platformLinks.trustpilot || platformLinks.Trustpilot
          console.log('📥 Setting Trustpilot link:', reviewLinkUpdate.trustpilot_review_link)
        }
        
        // Video Testimonial
        if (platformLinks['video-testimonial'] || platformLinks['Video Testimonial']) {
          reviewLinkUpdate.video_testimonial_link = platformLinks['video-testimonial'] || platformLinks['Video Testimonial']
          reviewLinkUpdate.video_upload_message = platformLinks['video-testimonial'] || platformLinks['Video Testimonial'] || 'Record a short video testimonial!'
          console.log('📥 Setting Video Testimonial link:', reviewLinkUpdate.video_testimonial_link)
          console.log('📥 Setting Video Testimonial message:', reviewLinkUpdate.video_upload_message)
        }
      }

      console.log('📥 Review link update data:', JSON.stringify(reviewLinkUpdate, null, 2))

      const { data: reviewLinkResult, error: reviewLinkError } = await supabase
        .from("review_link")
        .update(reviewLinkUpdate)
        .eq("user_id", userId)
        .select()

      if (reviewLinkError) {
        console.error("❌ Error updating review_link:", reviewLinkError)
      } else {
        console.log("✅ Review link updated successfully:")
        console.log("✅ Platforms saved:", reviewLinkResult[0]?.enabled_platforms)
        console.log("✅ Google link:", reviewLinkResult[0]?.google_review_link)
        console.log("✅ Facebook link:", reviewLinkResult[0]?.facebook_review_link)
        console.log("✅ Trustpilot link:", reviewLinkResult[0]?.trustpilot_review_link)
        console.log("✅ Video testimonial link:", reviewLinkResult[0]?.video_testimonial_link)
        console.log("✅ Video testimonial message:", reviewLinkResult[0]?.video_upload_message)
      }
    }

    // 4. Handle profile image if provided
    let profileImageUrl = null
    
    if (companyProfile?.profileImage && companyProfile.profileImage.startsWith('data:image/')) {
      console.log('📥 Processing profile image...')
      console.log('📥 Profile image length:', companyProfile.profileImage.length)
      
      try {
        const base64Data = companyProfile.profileImage.split(',')[1]
        const mimeType = companyProfile.profileImage.split(';')[0].split(':')[1]
        console.log('📥 Profile image MIME type:', mimeType)
        
        if (mimeType === 'image/svg+xml') {
          console.log('⚠️ SVG image detected - saving as data URL instead')
          // For SVG, save the data URL directly
          profileImageUrl = companyProfile.profileImage
        } else {
          // For other image types, upload to storage
          const fileExtension = mimeType.split('/')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          const fileName = `profile-${userId}-${Date.now()}.${fileExtension}`
          
          console.log('📥 Uploading image to storage:', fileName)
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true
            })
          
          if (uploadError) {
            console.error('❌ Upload error:', uploadError)
            // If upload fails, save data URL as fallback
            profileImageUrl = companyProfile.profileImage
            console.log('⚠️ Using data URL as fallback')
          } else if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('profile-images')
              .getPublicUrl(fileName)
            
            profileImageUrl = publicUrl
            console.log('✅ Profile image uploaded successfully:', publicUrl)
          }
        }
        
        // Update user record with profile image URL
        if (profileImageUrl) {
          console.log('📥 Updating user profile_picture_url...')
          
          const { data: updateResult, error: updateError } = await supabase
            .from("users")
            .update({ 
              profile_picture_url: profileImageUrl,
              updated_at: new Date().toISOString()
            })
            .eq("id", userId)
            .select()
          
          if (updateError) {
            console.error('❌ Error updating profile picture URL:', updateError)
          } else {
            console.log('✅ Profile picture URL saved to database:', profileImageUrl)
            console.log('✅ User record updated:', updateResult)
          }
        }
      } catch (error) {
        console.error('❌ Error handling profile image:', error)
      }
    } else {
      console.log('📥 No profile image provided')
    }

    // 5. Final verification - fetch all data to confirm saves
    console.log('🔍 Verifying all saves...')
    
    const { data: finalUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()
    
    const { data: finalReviewLink } = await supabase
      .from("review_link")
      .select("*")
      .eq("user_id", userId)
      .single()
    
    const { data: finalOnboarding } = await supabase
      .from("onboarding_data")
      .select("*")
      .eq("user_id", userId)
      .single()

    console.log('✅ Final verification:')
    console.log('  - User data:', finalUser ? 'Found' : 'Not found')
    console.log('  - Review link:', finalReviewLink ? 'Found' : 'Not found')
    console.log('  - Onboarding data:', finalOnboarding ? 'Found' : 'Not found')

    return NextResponse.json({ 
      success: true, 
      data: {
        user: finalUser,
        reviewLink: finalReviewLink,
        onboarding: finalOnboarding
      }
    })

  } catch (error) {
    console.error("❌ Error in complete save-onboarding:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}