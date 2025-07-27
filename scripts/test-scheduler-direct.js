#!/usr/bin/env node

/**
 * Direct test of the automation scheduler system
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testSchedulerDirect() {
  console.log('🧪 Testing Automation Scheduler Directly')
  console.log('=======================================\n')

  try {
    // Step 1: Create test user and email template
    console.log('1. Creating test user and email template...')
    
    // Create test user (let database generate UUID)
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .insert({
        first_name: 'Test',
        last_name: 'User', 
        email: 'test@example.com',
        company: 'Test Company',
        subscription_type: 'free',
        subscription_status: 'active'
      })
      .select()
      .single()

    if (userError) {
      console.log('❌ Error creating test user:', userError.message)
      return
    }
    const testUserId = testUser.id
    console.log(`✅ Test user created: ${testUserId}`)

    // Create test email template
    const { data: emailTemplate, error: templateError } = await supabase
      .from('email_templates')
      .insert({
        user_id: testUserId,
        name: 'Test Email Template',
        subject: 'Test: We would love your feedback, {{customerName}}!',
        content: 'Hi {{customerName}},\n\nThank you for choosing {{companyName}}! We would love to hear about your experience.\n\nPlease leave us a review: {{reviewUrl}}\n\nBest regards,\nThe {{companyName}} Team',
        from_email: 'test@example.com',
        sequence: JSON.stringify([]),
        initial_trigger: 'immediate',
        initial_wait_days: 0
      })
      .select()
      .single()

    if (templateError) {
      console.log('❌ Error creating email template:', templateError.message)
      return
    }
    console.log(`✅ Email template created: ${emailTemplate.id}`)

    // Step 2: Create test review
    console.log('\n2. Creating test review...')
    
    const testCustomerId = `test-customer-${Date.now()}`
    const { data: testReview, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: testUserId,
        customer_id: testCustomerId,
        customer_name: 'Test Customer',
        customer_email: 'customer@example.com',
        rating: 5,
        comment: 'Test review for automation',
        platform: 'internal',
        status: 'published'
      })
      .select()
      .single()

    if (reviewError) {
      console.log('❌ Error creating test review:', reviewError.message)
      return
    }
    console.log(`✅ Test review created: ${testReview.id}`)

    // Step 3: Call scheduler API
    console.log('\n3. Calling scheduler API...')
    
    const response = await fetch(`${baseUrl}/api/automation/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewId: testReview.id
      })
    })

    if (!response.ok) {
      console.log('❌ Scheduler API failed:', response.status, await response.text())
      return
    }

    const result = await response.json()
    console.log('✅ Scheduler API response:', JSON.stringify(result, null, 2))

    // Step 4: Check pending jobs
    console.log('\n4. Checking pending jobs...')
    
    const { data: pendingJobs, error: jobsError } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('user_id', testUserId)

    if (jobsError) {
      console.log('❌ Error fetching pending jobs:', jobsError.message)
    } else {
      console.log(`✅ Found ${pendingJobs.length} pending job(s):`)
      pendingJobs.forEach(job => {
        console.log(`   - Job ${job.id}: ${job.template_type} to ${job.customer_email}`)
        console.log(`     Scheduled for: ${new Date(job.scheduled_for).toLocaleString()}`)
        console.log(`     Status: ${job.status}`)
      })
    }

    // Step 5: Process pending jobs in test mode
    console.log('\n5. Processing pending jobs (test mode)...')
    
    const processResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=true`)
    
    if (!processResponse.ok) {
      console.log('❌ Process API failed:', processResponse.status, await processResponse.text())
    } else {
      const processResult = await processResponse.json()
      console.log('✅ Process result:', JSON.stringify(processResult, null, 2))
    }

    // Step 6: Clean up test data
    console.log('\n6. Cleaning up test data...')
    
    await supabase.from('automation_jobs').delete().eq('user_id', testUserId)
    await supabase.from('reviews').delete().eq('id', testReview.id)
    await supabase.from('email_templates').delete().eq('id', emailTemplate.id)
    await supabase.from('users').delete().eq('id', testUserId)
    
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 Direct scheduler test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testSchedulerDirect()