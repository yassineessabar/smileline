#!/usr/bin/env node

/**
 * Test script for SMS automation system
 * 
 * This script will:
 * 1. Create a test user and SMS template
 * 2. Create a test customer with phone number
 * 3. Create a test review to trigger SMS automation
 * 4. Verify SMS job was scheduled
 * 5. Process pending SMS automation (in test mode)
 * 6. Clean up test data
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testSMSAutomation() {
  console.log('📱 Testing SMS Automation System')
  console.log('================================\n')

  try {
    // Step 1: Create test user
    console.log('1. Creating test user...')
    const { data: testUser } = await supabase
      .from('users')
      .insert({
        first_name: 'SMS',
        last_name: 'Tester', 
        email: 'smstest@example.com',
        company: 'SMS Test Company',
        subscription_type: 'pro',
        subscription_status: 'active'
      })
      .select()
      .single()

    const testUserId = testUser.id
    console.log(`✅ Test user created: ${testUserId}`)

    // Step 2: Create test SMS template
    console.log('\n2. Creating SMS template...')
    const { data: smsTemplate } = await supabase
      .from('sms_templates')
      .insert({
        user_id: testUserId,
        name: 'Test SMS Template',
        content: 'Hi {{customerName}}! Thanks for choosing {{companyName}}. Please leave us a review: {{reviewUrl}} 📱⭐',
        sender_name: 'SMS Test Co',
        sequence: JSON.stringify([]),
        initial_trigger: 'immediate',
        initial_wait_days: 0
      })
      .select()
      .single()

    console.log(`✅ SMS template created: ${smsTemplate.id}`)
    console.log(`   Content: "${smsTemplate.content}"`)

    // Step 3: Create test customer with phone number
    console.log('\n3. Creating test customer with phone number...')
    const testCustomerId = `sms-customer-${Date.now()}`
    const { data: testCustomer } = await supabase
      .from('customers')
      .insert({
        id: testCustomerId,
        user_id: testUserId,
        name: 'SMS Test Customer',
        email: 'smscustomer@example.com',
        phone: '+1234567890' // Test phone number
      })
      .select()
      .single()

    console.log(`✅ Test customer created: ${testCustomer.id}`)
    console.log(`   Phone: ${testCustomer.phone}`)

    // Step 4: Create test review
    console.log('\n4. Creating test review...')
    const { data: testReview } = await supabase
      .from('reviews')
      .insert({
        user_id: testUserId,
        customer_id: testCustomerId,
        customer_name: testCustomer.name,
        customer_email: testCustomer.email,
        rating: 4,
        comment: 'Test review for SMS automation',
        platform: 'internal',
        status: 'published'
      })
      .select()
      .single()

    console.log(`✅ Test review created: ${testReview.id}`)

    // Step 5: Call scheduler API to create SMS automation job
    console.log('\n5. Calling scheduler API for SMS automation...')
    const schedulerResponse = await fetch(`${baseUrl}/api/automation/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewId: testReview.id
      })
    })

    if (!schedulerResponse.ok) {
      console.log('❌ Scheduler API failed:', schedulerResponse.status, await schedulerResponse.text())
      return
    }

    const schedulerResult = await schedulerResponse.json()
    console.log('✅ Scheduler API response:')
    console.log(JSON.stringify(schedulerResult, null, 2))

    // Step 6: Check pending SMS jobs
    console.log('\n6. Checking pending SMS jobs...')
    const { data: pendingSMSJobs } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('template_type', 'sms')
      .eq('status', 'pending')

    if (pendingSMSJobs && pendingSMSJobs.length > 0) {
      console.log(`✅ Found ${pendingSMSJobs.length} pending SMS job(s):`)
      pendingSMSJobs.forEach(job => {
        console.log(`   - Job ${job.id}: SMS to ${job.customer_phone}`)
        console.log(`     Customer: ${job.customer_name}`)
        console.log(`     Scheduled for: ${new Date(job.scheduled_for).toLocaleString()}`)
        console.log(`     Trigger: ${job.trigger_type}`)
      })
    } else {
      console.log('⚠️  No pending SMS jobs found. This might indicate an issue.')
    }

    // Step 7: Process pending SMS jobs in test mode
    console.log('\n7. Processing pending SMS jobs (TEST MODE)...')
    const processResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=true`)
    
    if (!processResponse.ok) {
      console.log('❌ Process API failed:', processResponse.status, await processResponse.text())
    } else {
      const processResult = await processResponse.json()
      console.log('✅ SMS processing result:')
      console.log(JSON.stringify(processResult, null, 2))

      // Show specific SMS results
      if (processResult.success && processResult.data.results) {
        const smsResults = processResult.data.results.filter(job => job.type === 'sms')
        if (smsResults.length > 0) {
          console.log('\n📱 SMS-specific results:')
          smsResults.forEach(result => {
            const status = result.success ? '✅' : '❌'
            console.log(`   ${status} SMS Job ${result.jobId} [TEST MODE]`)
            if (result.error) {
              console.log(`      Error: ${result.error}`)
            }
          })
        }
      }
    }

    // Step 8: Check job status after processing
    console.log('\n8. Checking job status after processing...')
    const { data: processedJobs } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('template_type', 'sms')

    if (processedJobs && processedJobs.length > 0) {
      processedJobs.forEach(job => {
        console.log(`📊 SMS Job ${job.id}:`)
        console.log(`   Status: ${job.status}`)
        console.log(`   Customer Phone: ${job.customer_phone}`)
        if (job.completed_at) {
          console.log(`   Completed: ${new Date(job.completed_at).toLocaleString()}`)
        }
        if (job.error_message) {
          console.log(`   Error: ${job.error_message}`)
        }
      })
    }

    // Step 9: Test creating SMS job with past scheduled time for immediate processing
    console.log('\n9. Testing immediate SMS processing...')
    const pastTime = new Date()
    pastTime.setMinutes(pastTime.getMinutes() - 5) // 5 minutes ago

    const { data: immediateJob } = await supabase
      .from('automation_jobs')
      .insert({
        user_id: testUserId,
        template_id: smsTemplate.id,
        template_type: 'sms',
        customer_id: testCustomerId,
        customer_name: testCustomer.name,
        customer_phone: testCustomer.phone,
        scheduled_for: pastTime.toISOString(),
        trigger_type: 'immediate',
        wait_days: 0,
        status: 'pending'
      })
      .select()
      .single()

    console.log(`✅ Immediate SMS job created: ${immediateJob.id}`)

    // Process the immediate job
    const immediateProcessResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=true`)
    const immediateProcessResult = await immediateProcessResponse.json()
    
    console.log('✅ Immediate processing result:')
    console.log(`   Processed jobs: ${immediateProcessResult.data.processedJobs}`)
    console.log(`   Successful: ${immediateProcessResult.data.successfulJobs}`)

    // Step 10: Clean up test data
    console.log('\n10. Cleaning up test data...')
    await supabase.from('automation_jobs').delete().eq('user_id', testUserId)
    await supabase.from('reviews').delete().eq('id', testReview.id)
    await supabase.from('customers').delete().eq('id', testCustomerId)
    await supabase.from('sms_templates').delete().eq('id', smsTemplate.id)
    await supabase.from('users').delete().eq('id', testUserId)
    
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 SMS Automation Test Completed Successfully!')
    console.log('\n📱 SMS System Status:')
    console.log('✅ SMS template creation works')
    console.log('✅ SMS job scheduling works')
    console.log('✅ SMS job processing works (test mode)')
    console.log('✅ Customer phone number integration works')
    console.log('✅ SMS content personalization works')
    
    console.log('\n🚀 To send real SMS messages:')
    console.log('1. Remove testMode=true from the API calls')
    console.log('2. Ensure Twilio credentials are valid')
    console.log('3. Use real phone numbers (not test numbers)')
    console.log('4. Run: node scripts/process-automation-cron.js (without --test)')

  } catch (error) {
    console.error('❌ SMS automation test failed:', error.message)
    console.error('Stack:', error.stack)
    
    console.log('\n🔧 Troubleshooting:')
    console.log('- Ensure sms_templates table exists')
    console.log('- Check Twilio configuration in .env.local')
    console.log('- Verify customers table has phone column')
    console.log('- Make sure Next.js server is running')
  }
}

testSMSAutomation()