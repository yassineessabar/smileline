#!/usr/bin/env node

/**
 * Test the automation system with immediate processing (past scheduled time)
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testImmediateProcessing() {
  console.log('🧪 Testing Immediate Automation Processing')
  console.log('=========================================\n')

  try {
    // Create test user
    const { data: testUser } = await supabase
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

    const testUserId = testUser.id
    console.log(`✅ Test user created: ${testUserId}`)

    // Create email template
    const { data: emailTemplate } = await supabase
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

    console.log(`✅ Email template created: ${emailTemplate.id}`)

    // Create automation job with past scheduled time (so it processes immediately)
    const pastTime = new Date()
    pastTime.setMinutes(pastTime.getMinutes() - 5) // 5 minutes ago

    const { data: automationJob } = await supabase
      .from('automation_jobs')
      .insert({
        user_id: testUserId,
        template_id: emailTemplate.id,
        template_type: 'email',
        customer_id: 'test-customer-123',
        customer_name: 'Test Customer',
        customer_email: 'customer@example.com',
        scheduled_for: pastTime.toISOString(),
        trigger_type: 'immediate',
        wait_days: 0,
        status: 'pending'
      })
      .select()
      .single()

    console.log(`✅ Automation job created: ${automationJob.id}`)
    console.log(`   Scheduled for: ${new Date(automationJob.scheduled_for).toLocaleString()} (past time)`)

    // Now process pending jobs
    console.log('\n🔄 Processing pending automation jobs (test mode)...')
    
    const processResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=true`)
    const processResult = await processResponse.json()
    
    console.log('📋 Process result:')
    console.log(JSON.stringify(processResult, null, 2))

    // Check job status after processing
    const { data: updatedJob } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('id', automationJob.id)
      .single()

    console.log(`\n📊 Job status after processing: ${updatedJob.status}`)
    if (updatedJob.completed_at) {
      console.log(`   Completed at: ${new Date(updatedJob.completed_at).toLocaleString()}`)
    }
    if (updatedJob.error_message) {
      console.log(`   Error: ${updatedJob.error_message}`)
    }

    // Clean up
    await supabase.from('automation_jobs').delete().eq('id', automationJob.id)
    await supabase.from('email_templates').delete().eq('id', emailTemplate.id)
    await supabase.from('users').delete().eq('id', testUserId)
    
    console.log('\n✅ Test data cleaned up')
    console.log('\n🎉 Immediate processing test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testImmediateProcessing()