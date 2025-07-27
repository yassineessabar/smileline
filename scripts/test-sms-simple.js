#!/usr/bin/env node

/**
 * Simplified SMS automation test that works with existing database structure
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testSMSSimple() {
  console.log('📱 Testing SMS Automation (Simplified)')
  console.log('=====================================\n')

  try {
    // Step 1: Get or create test user
    console.log('1. Getting test user...')
    
    // Try to get existing test user first
    let { data: testUser } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, company')
      .eq('email', 'smstest@example.com')
      .single()

    if (!testUser) {
      // Create new test user if doesn't exist
      console.log('   Creating new test user...')
      const { data: newUser, error: userError } = await supabase
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
      
      if (userError) {
        console.error('❌ Error creating user:', userError.message)
        return
      }
      testUser = newUser
    }

    const testUserId = testUser.id
    console.log(`✅ Test user ready: ${testUserId} (${testUser.email})`)

    // Step 2: Create or update SMS template (upsert to handle unique constraint)
    console.log('\n2. Creating/updating SMS template...')
    const { data: smsTemplate } = await supabase
      .from('sms_templates')
      .upsert({
        user_id: testUserId,
        name: 'Test SMS Template',
        content: 'Hi {{customerName}}! Thanks for choosing {{companyName}}. Please leave us a review: {{reviewUrl}} 📱⭐',
        sender_name: 'SMS Test Co',
        sequence: JSON.stringify([]),
        initial_trigger: 'immediate',
        initial_wait_days: 0
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    console.log(`✅ SMS template ready: ${smsTemplate.id}`)

    // Step 3: Create SMS automation job directly (simulating what scheduler would do)
    console.log('\n3. Creating SMS automation job directly...')
    const pastTime = new Date()
    pastTime.setMinutes(pastTime.getMinutes() - 5) // 5 minutes ago for immediate processing

    const { data: smsJob } = await supabase
      .from('automation_jobs')
      .insert({
        user_id: testUserId,
        template_id: smsTemplate.id,
        template_type: 'sms',
        customer_id: 'test-sms-customer-123',
        customer_name: 'Test SMS Customer',
        customer_phone: '+1234567890', // Test phone number
        scheduled_for: pastTime.toISOString(),
        trigger_type: 'immediate',
        wait_days: 0,
        status: 'pending'
      })
      .select()
      .single()

    console.log(`✅ SMS automation job created: ${smsJob.id}`)
    console.log(`   Customer Phone: ${smsJob.customer_phone}`)
    console.log(`   Scheduled for: ${new Date(smsJob.scheduled_for).toLocaleString()} (past time)`)

    // Step 4: Process pending SMS jobs in test mode
    console.log('\n4. Processing pending SMS jobs (TEST MODE)...')
    const processResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=true`)
    
    if (!processResponse.ok) {
      console.log('❌ Process API failed:', processResponse.status, await processResponse.text())
    } else {
      const processResult = await processResponse.json()
      console.log('✅ SMS processing result:')
      console.log(JSON.stringify(processResult, null, 2))

      // Check if SMS was processed
      if (processResult.success && processResult.data.results) {
        const smsResults = processResult.data.results.filter(job => job.type === 'sms')
        console.log(`\n📱 SMS Results: ${smsResults.length} SMS job(s) processed`)
        
        smsResults.forEach(result => {
          const status = result.success ? '✅' : '❌'
          console.log(`   ${status} SMS Job ${result.jobId} [TEST MODE]`)
          if (result.error) {
            console.log(`      Error: ${result.error}`)
          }
        })
      }
    }

    // Step 5: Check job status after processing
    console.log('\n5. Checking SMS job status after processing...')
    const { data: updatedJob } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('id', smsJob.id)
      .single()

    console.log(`📊 SMS Job Status: ${updatedJob.status}`)
    if (updatedJob.completed_at) {
      console.log(`   Completed: ${new Date(updatedJob.completed_at).toLocaleString()}`)
    }
    if (updatedJob.error_message) {
      console.log(`   Error: ${updatedJob.error_message}`)
    }

    // Step 6: Test Twilio configuration
    console.log('\n6. Checking Twilio configuration...')
    console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`)
    console.log(`   Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`)
    console.log(`   Phone Number: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Set (' + process.env.TWILIO_PHONE_NUMBER + ')' : '❌ Missing'}`)

    // Step 7: Clean up
    console.log('\n7. Cleaning up test data...')
    await supabase.from('automation_jobs').delete().eq('id', smsJob.id)
    await supabase.from('sms_templates').delete().eq('id', smsTemplate.id)
    await supabase.from('users').delete().eq('id', testUserId)
    
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 SMS Automation Test Results:')
    
    if (updatedJob.status === 'completed') {
      console.log('✅ SMS automation is working correctly!')
      console.log('✅ SMS template creation works')
      console.log('✅ SMS job scheduling works')
      console.log('✅ SMS job processing works (test mode)')
      console.log('✅ SMS content personalization ready')
      
      console.log('\n📱 To send real SMS messages:')
      console.log('1. Run without testMode: node scripts/process-automation-cron.js')
      console.log('2. Use real phone numbers (format: +1234567890)')
      console.log('3. Ensure Twilio account has sufficient credits')
      console.log('4. Verify phone number is verified in Twilio (if trial account)')
    } else {
      console.log('⚠️  SMS job processing had issues - check error messages above')
    }

  } catch (error) {
    console.error('❌ SMS test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testSMSSimple()