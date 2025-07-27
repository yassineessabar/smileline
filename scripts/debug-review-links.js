const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugReviewLinks() {
  try {
    console.log('🔍 Debugging all review links...')
    
    // Get all review links
    const { data: reviewLinks, error } = await supabase
      .from('review_link')
      .select('*')
    
    if (error) {
      console.error('❌ Error fetching review links:', error)
      return
    }
    
    console.log(`📊 Found ${reviewLinks.length} total review links`)
    
    for (const reviewLink of reviewLinks) {
      console.log(`\n🔗 Review Link ID: ${reviewLink.id}`)
      console.log(`👤 User ID: ${reviewLink.user_id}`)
      console.log(`🏢 Company: ${reviewLink.company_name}`)
      console.log(`🌐 URL: ${reviewLink.review_url}`)
      console.log(`⚙️ Enabled platforms:`, reviewLink.enabled_platforms)
      
      if (reviewLink.links) {
        console.log(`🔗 Links (${reviewLink.links.length}):`)
        reviewLink.links.forEach((link, i) => {
          console.log(`  ${i+1}. ${link.title} (${link.platformId})`)
          console.log(`     URL: ${link.url}`)
          console.log(`     Button: ${link.buttonText}`)
          console.log(`     Active: ${link.isActive}`)
        })
      } else {
        console.log('🔗 Links: null')
      }
      
      // Check if this review link has video testimonial in enabled_platforms
      if (reviewLink.enabled_platforms && reviewLink.enabled_platforms.includes('video-testimonial')) {
        console.log('🎥 ✅ Has video testimonial in enabled_platforms')
        
        // Check if links array has video testimonial
        if (reviewLink.links) {
          const videoLink = reviewLink.links.find(link => link.platformId === 'video-testimonial')
          if (videoLink) {
            console.log('🎥 ✅ Has video testimonial in links array')
            if (videoLink.buttonText === 'Upload Video Testimonial') {
              console.log('✅ Button text is correct')
            } else {
              console.log(`❌ Button text is wrong: "${videoLink.buttonText}"`)
            }
          } else {
            console.log('🎥 ❌ Missing video testimonial in links array')
          }
        }
      } else {
        console.log('🎥 ❌ No video testimonial in enabled_platforms')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugReviewLinks()