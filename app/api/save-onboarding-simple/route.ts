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

async function saveAdditionalData(userId: string, data: any) {
  console.log('🔍 saveAdditionalData called with:', JSON.stringify(data, null, 2))
  
  const { businessCategory, selectedPlatforms, platformLinks, companyProfile, companyName } = data

  console.log('🔍 Extracted data:')
  console.log('  - businessCategory:', businessCategory)
  console.log('  - selectedPlatforms:', selectedPlatforms)
  console.log('  - platformLinks:', platformLinks)
  console.log('  - companyProfile:', companyProfile)
  console.log('  - companyName:', companyName)

  // 1. Business category is already saved to users.store_type in the main function
  console.log('🔍 Business category already saved to users.store_type')
  if (businessCategory?.category) {
    console.log('✅ Business category saved:', businessCategory.category)
  }

  // 2. Save platforms and links to review_link
  console.log('🔍 Checking selected platforms...')
  console.log('🔍 selectedPlatforms type:', typeof selectedPlatforms)
  console.log('🔍 selectedPlatforms array check:', Array.isArray(selectedPlatforms))
  console.log('🔍 selectedPlatforms length:', selectedPlatforms?.length)
  
  if (selectedPlatforms && selectedPlatforms.length > 0) {
    try {
      console.log('📥 Saving platforms:', selectedPlatforms)
      
      const { data: existing, error: fetchError } = await supabase
        .from("review_link")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (fetchError) {
        console.error('❌ Error fetching existing review_link:', fetchError)
      } else {
        console.log('📥 Existing review_link:', existing)
      }

      const reviewLinkData = {
        user_id: userId,
        company_name: companyName || 'My Company',
        review_url: `https://loop.review/${(companyName || 'company').toLowerCase().replace(/\s+/g, '')}`,
        enabled_platforms: selectedPlatforms,
        updated_at: new Date().toISOString()
      }
      
      // Only add these fields if we're creating a new record, not updating
      if (!existing) {
        reviewLinkData.review_qr_code = ''
        reviewLinkData.rating_page_content = 'Thank you for choosing us! Please leave us a review.'
        reviewLinkData.redirect_message = 'Thank you for your review!'
        reviewLinkData.internal_notification_message = 'New review received'
        reviewLinkData.video_upload_message = 'Upload a video review'
        reviewLinkData.primary_color = '#3B82F6'
        reviewLinkData.secondary_color = '#1E40AF'
        reviewLinkData.background_color = '#FFFFFF'
        reviewLinkData.text_color = '#000000'
        reviewLinkData.button_text_color = '#FFFFFF'
        reviewLinkData.button_style = 'rounded'
        reviewLinkData.font = 'Inter'
        reviewLinkData.show_badge = true
        reviewLinkData.links = []
        reviewLinkData.header_settings = {}
        reviewLinkData.initial_view_settings = {}
        reviewLinkData.negative_settings = {}
        reviewLinkData.video_upload_settings = {}
      }

      console.log('📥 Review link data to save:', reviewLinkData)

      if (existing) {
        console.log('📥 Updating existing review_link...')
        const { data: updateResult, error: updateError } = await supabase
          .from("review_link")
          .update(reviewLinkData)
          .eq("id", existing.id)
          .select()

        if (updateError) {
          console.error('❌ Error updating review_link:', updateError)
        } else {
          console.log('✅ Review link updated:', updateResult)
        }
      } else {
        console.log('📥 Creating new review_link...')
        const { data: insertResult, error: insertError } = await supabase
          .from("review_link")
          .insert({ ...reviewLinkData, created_at: new Date().toISOString() })
          .select()

        if (insertError) {
          console.error('❌ Error inserting review_link:', insertError)
        } else {
          console.log('✅ Review link created:', insertResult)
        }
      }
      
      console.log('✅ Review link operation completed')
    } catch (error) {
      console.error('❌ Exception in review link save:', error)
    }
  } else {
    console.log('⚠️ No platforms to save')
  }

  // 3. Save profile picture if provided and update user record
  console.log('🔍 Checking profile image...')
  console.log('🔍 companyProfile:', companyProfile)
  console.log('🔍 profileImage exists:', !!companyProfile?.profileImage)
  
  let profileImageUrl = null
  
  if (companyProfile?.profileImage) {
    try {
      console.log('📥 Profile image provided (length):', companyProfile.profileImage.length)
      console.log('📥 Profile image type:', typeof companyProfile.profileImage)
      console.log('📥 Profile image first 50 chars:', companyProfile.profileImage.substring(0, 50))
      
      // Check if it's a data URL (base64 image)
      if (companyProfile.profileImage.startsWith('data:image/')) {
        // Extract the base64 data
        const base64Data = companyProfile.profileImage.split(',')[1]
        const mimeType = companyProfile.profileImage.split(';')[0].split(':')[1]
        let fileExtension = mimeType.split('/')[1]
        
        // Handle SVG files - save as data URL
        if (mimeType === 'image/svg+xml') {
          console.log('📥 SVG detected, saving as data URL')
          
          // Save SVG data URL directly to database
          const { data: svgUpdateResult, error: svgUpdateError } = await supabase
            .from("users")
            .update({ 
              profile_picture_url: companyProfile.profileImage,
              updated_at: new Date().toISOString()
            })
            .eq("id", userId)
            .select()
          
          if (svgUpdateError) {
            console.error('❌ Error saving SVG profile image:', svgUpdateError)
          } else {
            console.log('✅ SVG profile image saved as data URL')
            console.log('✅ User updated with SVG image:', svgUpdateResult)
          }
          
          return // Skip the upload
        }
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64')
        
        // Generate a unique filename
        const fileName = `profile-${userId}-${Date.now()}.${fileExtension}`
        
        console.log('📥 Uploading profile image to Supabase storage...')
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
          })
        
        if (uploadError) {
          console.error('❌ Error uploading profile image:', uploadError)
        } else {
          console.log('✅ Profile image uploaded:', uploadData)
          
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName)
          
          console.log('📥 Profile image public URL:', publicUrl)
          
          // Update user with profile image URL
          if (publicUrl) {
            profileImageUrl = publicUrl
            console.log('📥 Profile image URL to save:', publicUrl)
            
            // Update user record with profile image URL
            const { error: profileUpdateError } = await supabase
              .from("users")
              .update({ profile_picture_url: publicUrl })
              .eq("id", userId)
            
            if (profileUpdateError) {
              console.error('❌ Error updating profile image URL:', profileUpdateError)
            } else {
              console.log('✅ Profile image URL saved to database')
            }
          }
        }
      } else {
        console.log('✅ Profile image noted (not base64 format)')
      }
    } catch (error) {
      console.error('❌ Error handling profile image:', error)
    }
  } else {
    console.log('⚠️ No profile image to save')
  }

  // 4. Save ALL platform links to both review_link and users table
  console.log('🔍 Checking platform links...')
  console.log('🔍 platformLinks type:', typeof platformLinks)
  console.log('🔍 platformLinks keys:', platformLinks ? Object.keys(platformLinks) : 'null')
  console.log('🔍 platformLinks full data:', JSON.stringify(platformLinks, null, 2))
  
  if (platformLinks && Object.keys(platformLinks).length > 0) {
    try {
      console.log('📥 Platform links to save:', platformLinks)
      
      // First, save platform links to users table (if the column exists)
      try {
        const { error: userPlatformError } = await supabase
          .from("users")
          .update({ 
            platform_links: platformLinks,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId)
        
        if (userPlatformError) {
          console.log('⚠️ Could not save platform_links to users table:', userPlatformError.message)
        } else {
          console.log('✅ Platform links saved to users.platform_links')
        }
      } catch (e) {
        console.log('⚠️ users.platform_links column might not exist')
      }
      
      // Then update the review_link with platform links data
      const { data: existingReviewLink, error: fetchError } = await supabase
        .from("review_link")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (existingReviewLink) {
        // Build update data for ALL platform links
        const updateData = {
          updated_at: new Date().toISOString()
        }
        
        // Add all platform links (handle case variations)
        if (platformLinks.google || platformLinks.Google) {
          updateData.google_review_link = platformLinks.google || platformLinks.Google
          console.log('📥 Adding Google link:', updateData.google_review_link)
        }
        
        if (platformLinks.facebook || platformLinks.Facebook) {
          updateData.facebook_review_link = platformLinks.facebook || platformLinks.Facebook
          console.log('📥 Adding Facebook link:', updateData.facebook_review_link)
        }
        
        if (platformLinks.trustpilot || platformLinks.Trustpilot) {
          updateData.trustpilot_review_link = platformLinks.trustpilot || platformLinks.Trustpilot
          console.log('📥 Adding Trustpilot link:', updateData.trustpilot_review_link)
        }
        
        // Video Testimonial
        if (platformLinks['video-testimonial'] || platformLinks['Video Testimonial']) {
          updateData.video_testimonial_link = platformLinks['video-testimonial'] || platformLinks['Video Testimonial']
          updateData.video_upload_message = platformLinks['video-testimonial'] || platformLinks['Video Testimonial'] || 'Record a short video testimonial!'
          console.log('📥 Adding Video Testimonial link:', updateData.video_testimonial_link)
          console.log('📥 Adding Video Testimonial message:', updateData.video_upload_message)
        }
        
        // For platforms without dedicated fields, we'll store them in a links array or note them
        const otherPlatforms = []
        if (platformLinks.shopify || platformLinks.Shopify) {
          otherPlatforms.push({ platform: 'shopify', url: platformLinks.shopify || platformLinks.Shopify })
          console.log('📥 Shopify link noted:', platformLinks.shopify || platformLinks.Shopify)
        }
        if (platformLinks.amazon || platformLinks.Amazon) {
          otherPlatforms.push({ platform: 'amazon', url: platformLinks.amazon || platformLinks.Amazon })
          console.log('📥 Amazon link noted:', platformLinks.amazon || platformLinks.Amazon)
        }
        if (platformLinks['video-testimonial']) {
          otherPlatforms.push({ platform: 'video-testimonial', message: platformLinks['video-testimonial'] })
          console.log('📥 Video testimonial message noted:', platformLinks['video-testimonial'])
        }
        
        // If there are other platforms, add them to the links field
        if (otherPlatforms.length > 0) {
          updateData.links = otherPlatforms
        }

        console.log('📥 Final review_link update data:', JSON.stringify(updateData, null, 2))

        const { data: updateResult, error: updateError } = await supabase
          .from("review_link")
          .update(updateData)
          .eq("id", existingReviewLink.id)
          .select()

        if (updateError) {
          console.error('❌ Error updating review_link with platform links:', updateError)
        } else {
          console.log('✅ Platform links successfully added to review_link')
          console.log('✅ Updated review_link data:', JSON.stringify(updateResult[0], null, 2))
        }
      } else {
        console.log('⚠️ No review_link found to add platform links to')
      }
      
      console.log('✅ Platform links operation completed')
    } catch (error) {
      console.error('❌ Exception in platform links save:', error)
    }
  } else {
    console.log('⚠️ No platform links to save')
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Simple save onboarding: Starting request')
    const userId = await getUserIdFromSession()
    
    if (!userId) {
      console.log('📥 Simple save onboarding: Authentication failed')
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    console.log('📥 Simple save onboarding: Received data for user:', userId)
    console.log('📥 Simple save onboarding: Full body:', JSON.stringify(body, null, 2))
    console.log('📥 Body keys:', Object.keys(body))
    console.log('📥 Body values summary:')
    Object.keys(body).forEach(key => {
      const value = body[key]
      if (value && typeof value === 'object') {
        console.log(`  - ${key}: [object] keys=${Object.keys(value)}`)
      } else {
        console.log(`  - ${key}: ${typeof value} = ${value}`)
      }
    })

    const { 
      companyName, 
      companyProfile, 
      businessCategory, 
      selectedPlatforms, 
      platformLinks 
    } = body

    // Update user table data with ALL onboarding information
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Company name
    if (companyName) {
      updateData.company = companyName
      console.log('📥 Setting company to:', companyName)
    } else if (companyProfile?.displayName) {
      updateData.company = companyProfile.displayName
      console.log('📥 Setting company to:', companyProfile.displayName)
    }

    // Business category and description
    if (businessCategory?.category) {
      updateData.store_type = businessCategory.category
      updateData.business_category = businessCategory.category
      console.log('📥 Business category:', businessCategory.category)
    }
    
    if (businessCategory?.description) {
      updateData.business_description = businessCategory.description
      console.log('📥 Business description:', businessCategory.description)
    }

    // Selected platforms
    if (selectedPlatforms && selectedPlatforms.length > 0) {
      updateData.selected_platforms = selectedPlatforms
      console.log('📥 Selected platforms:', selectedPlatforms)
    }

    // Platform links
    if (platformLinks && Object.keys(platformLinks).length > 0) {
      updateData.platform_links = platformLinks
      console.log('📥 Platform links:', platformLinks)
    }

    // Profile information
    if (companyProfile?.bio) {
      updateData.bio = companyProfile.bio
      console.log('📥 Bio:', companyProfile.bio)
    }

    if (companyProfile?.displayName) {
      updateData.display_name = companyProfile.displayName
      console.log('📥 Display name:', companyProfile.displayName)
    }

    // Note: Profile image URL will be set after upload
    // Template selection can be added here if needed

    console.log('📥 Final update data:', updateData)
    console.log('📥 Update data keys count:', Object.keys(updateData).length)

    let userData = null

    if (Object.keys(updateData).length > 1) {
      console.log('📥 Attempting database update with:', updateData)
      
      const { data: updateResult, error: userError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single()

      if (userError) {
        console.error("❌ Error updating user:", userError)
        console.error("❌ Error details:", {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code
        })
        return NextResponse.json({ 
          success: false, 
          error: userError.message,
          details: userError.details,
          code: userError.code
        }, { status: 500 })
      }

      userData = updateResult
      console.log('✅ User updated successfully:', userData)
      
      // Additional verification - fetch the user again to confirm the update
      console.log('🔍 Verifying update by fetching user again...')
      const { data: verificationData, error: verificationError } = await supabase
        .from("users")
        .select("id, email, company, store_type, updated_at")
        .eq("id", userId)
        .single()
      
      if (verificationError) {
        console.error('❌ Error verifying update:', verificationError)
      } else {
        console.log('✅ Verification data from database:', verificationData)
        console.log('✅ Company field value:', verificationData.company)
        console.log('✅ Store type field value:', verificationData.store_type)
      }
    } else {
      console.log('📥 No user updates needed')
      // Get existing user data
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()
      userData = existingUser
    }

    // Now save additional onboarding data
    await saveAdditionalData(userId, {
      businessCategory,
      selectedPlatforms,
      platformLinks,
      companyProfile,
      companyName: userData?.company
    })

    return NextResponse.json({ success: true, data: userData })

  } catch (error) {
    console.error("❌ Error in simple save-onboarding:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}