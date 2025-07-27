const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkEnabledPlatforms() {
  try {
    console.log('🔍 Checking enabled platforms vs selected platforms...')
    
    // Get all review links
    const { data: reviewLinks, error } = await supabase
      .from('review_link')
      .select('id, user_id, company_name, enabled_platforms, links')
    
    if (error) {
      console.error('❌ Error fetching review links:', error)
      return
    }
    
    // Also get users table to check selected_platforms
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, company, selected_platforms')
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📊 Found ${reviewLinks.length} review links`)
    
    for (const reviewLink of reviewLinks) {
      const user = users.find(u => u.id === reviewLink.user_id)
      
      console.log(`\n🔗 Review Link: ${reviewLink.company_name} (${reviewLink.id.slice(0, 8)}...)`)
      console.log(`👤 User ID: ${reviewLink.user_id}`)
      console.log(`📋 Review link enabled_platforms:`, reviewLink.enabled_platforms)
      console.log(`👤 User selected_platforms:`, user?.selected_platforms)
      
      if (reviewLink.links && reviewLink.links.length > 0) {
        console.log(`🔗 Links (${reviewLink.links.length}):`)
        reviewLink.links.forEach(link => {
          console.log(`  - ${link.title} (${link.platformId}): "${link.buttonText}"`)
        })
      } else {
        console.log('🔗 No links configured')
      }
      
      // Check for mismatches
      if (user?.selected_platforms && reviewLink.enabled_platforms) {
        const userPlatforms = user.selected_platforms.sort()
        const enabledPlatforms = reviewLink.enabled_platforms.sort()
        
        if (JSON.stringify(userPlatforms) !== JSON.stringify(enabledPlatforms)) {
          console.log('⚠️  MISMATCH between user selected_platforms and review_link enabled_platforms!')
          console.log(`     User has: ${userPlatforms.join(', ')}`)
          console.log(`     Review link has: ${enabledPlatforms.join(', ')}`)
        } else {
          console.log('✅ Platforms match')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkEnabledPlatforms()