const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkVideoLinks() {
  try {
    console.log('🔍 Checking video testimonial links...')
    
    // Get review links with video testimonial
    const { data: reviewLinks, error } = await supabase
      .from('review_link')
      .select('id, user_id, enabled_platforms, links')
      .contains('enabled_platforms', ['video-testimonial'])
    
    if (error) {
      console.error('❌ Error fetching review links:', error)
      return
    }
    
    console.log(`📊 Found ${reviewLinks.length} review links with video testimonial enabled`)
    
    let fixCount = 0
    
    for (const reviewLink of reviewLinks) {
      console.log(`\n👤 User ${reviewLink.user_id}:`)
      console.log('📋 Enabled platforms:', reviewLink.enabled_platforms)
      
      if (reviewLink.links) {
        const videoLink = reviewLink.links.find(link => link.platformId === 'video-testimonial')
        if (videoLink) {
          console.log('🎥 Video link found:')
          console.log('  - Button text:', videoLink.buttonText)
          console.log('  - URL:', videoLink.url)
          console.log('  - Active:', videoLink.isActive)
          
          if (videoLink.buttonText !== 'Upload Video Testimonial' || videoLink.url !== '#video-upload') {
            console.log('🔧 Needs fixing!')
            
            const updatedLinks = reviewLink.links.map(link => {
              if (link.platformId === 'video-testimonial') {
                return {
                  ...link,
                  url: '#video-upload',
                  buttonText: 'Upload Video Testimonial',
                  isActive: true
                }
              }
              return link
            })
            
            const { error: updateError } = await supabase
              .from('review_link')
              .update({ 
                links: updatedLinks,
                updated_at: new Date().toISOString()
              })
              .eq('id', reviewLink.id)
            
            if (updateError) {
              console.error('❌ Error updating:', updateError)
            } else {
              console.log('✅ Fixed!')
              fixCount++
            }
          } else {
            console.log('✅ Already correct')
          }
        } else {
          console.log('❌ No video link found in links array')
          
          // Add missing video link
          const newVideoLink = {
            id: Date.now(),
            title: 'Video Testimonial',
            url: '#video-upload',
            buttonText: 'Upload Video Testimonial',
            clicks: 0,
            isActive: true,
            platformId: 'video-testimonial',
            platformLogo: '/video-testimonial-icon.svg'
          }
          
          const updatedLinks = [...reviewLink.links, newVideoLink]
          
          const { error: updateError } = await supabase
            .from('review_link')
            .update({ 
              links: updatedLinks,
              updated_at: new Date().toISOString()
            })
            .eq('id', reviewLink.id)
          
          if (updateError) {
            console.error('❌ Error adding video link:', updateError)
          } else {
            console.log('✅ Added missing video link!')
            fixCount++
          }
        }
      } else {
        console.log('❌ No links array')
        
        // Create links array with video testimonial
        const newLinks = [{
          id: Date.now(),
          title: 'Video Testimonial',
          url: '#video-upload',
          buttonText: 'Upload Video Testimonial',
          clicks: 0,
          isActive: true,
          platformId: 'video-testimonial',
          platformLogo: '/video-testimonial-icon.svg'
        }]
        
        const { error: updateError } = await supabase
          .from('review_link')
          .update({ 
            links: newLinks,
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewLink.id)
        
        if (updateError) {
          console.error('❌ Error creating links array:', updateError)
        } else {
          console.log('✅ Created links array with video testimonial!')
          fixCount++
        }
      }
    }
    
    console.log(`\n🎉 Fixed ${fixCount} video testimonial links`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkVideoLinks()