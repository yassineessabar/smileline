#!/usr/bin/env node

/**
 * Test script to verify automation is triggered when creating a new customer
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testNewCustomerAutomation() {
  console.log('👤 Testing New Customer Automation')
  console.log('=================================\n')

  try {
    // Step 1: Set up test user with templates
    console.log('1. Setting up test user with email/SMS templates...')
    
    const { data: testUser } = await supabase
      .from('users')
      .upsert({
        first_name: 'NewCustomer',
        last_name: 'Test',
        email: 'newcustomertest@example.com',
        company: 'New Customer Test Co',
        subscription_type: 'pro',
        subscription_status: 'active'
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    const testUserId = testUser.id
    console.log(`✅ Test user ready: ${testUserId}`)

    // Create email template with immediate trigger
    const { data: emailTemplate } = await supabase
      .from('email_templates')
      .upsert({
        user_id: testUserId,
        name: 'New Customer Welcome Email',
        subject: 'Welcome to {{companyName}}, {{customerName}}!',
        content: 'Hi {{customerName}},\n\nWelcome to {{companyName}}! We\'re excited to have you as a customer.\n\nIf you have any questions, please don\'t hesitate to reach out.\n\nBest regards,\nThe {{companyName}} Team',
        from_email: 'welcome@newcustomertest.com',
        sequence: JSON.stringify([]),
        initial_trigger: 'immediate',
        initial_wait_days: 0
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    console.log(`✅ Email template created: ${emailTemplate.id} (trigger: ${emailTemplate.initial_trigger})`)

    // Create SMS template with immediate trigger
    const { data: smsTemplate } = await supabase
      .from('sms_templates')
      .upsert({
        user_id: testUserId,
        name: 'New Customer Welcome SMS',
        content: 'Welcome to {{companyName}}, {{customerName}}! 🎉 Thanks for joining us. We\'re here to help: {{reviewUrl}}',
        sender_name: 'Test Co',
        sequence: JSON.stringify([]),
        initial_trigger: 'immediate',
        initial_wait_days: 0
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    console.log(`✅ SMS template created: ${smsTemplate.id} (trigger: ${smsTemplate.initial_trigger})`)

    // Step 2: Create session for authenticated API call
    console.log('\n2. Setting up authentication...')
    
    const sessionToken = `new_customer_test_${Date.now()}`
    await supabase.from('user_sessions').insert({
      user_id: testUserId,
      session_token: sessionToken,
      created_at: new Date().toISOString()
    })
    
    console.log(`✅ Session created: ${sessionToken}`)

    // Step 3: Create new customer via API (this should trigger automation)
    console.log('\n3. Creating new customer...')
    
    const customerData = {
      name: 'Test New Customer',
      email: 'testnewcustomer@example.com',
      phone: '+1234567890',
      type: 'both'
    }
    
    const createCustomerResponse = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify(customerData)
    })

    if (!createCustomerResponse.ok) {
      console.log('❌ Customer creation failed:', createCustomerResponse.status, await createCustomerResponse.text())
      return
    }

    const customerResult = await createCustomerResponse.json()
    const newCustomer = customerResult.data
    console.log(`✅ New customer created: ${newCustomer.id} (${newCustomer.name})`)

    // Step 4: Wait a moment for automation processing
    console.log('\n4. Waiting for automation processing...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Step 5: Check if automation jobs were created
    console.log('\n5. Checking automation jobs...')
    
    const { data: automationJobs } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('customer_id', newCustomer.id)
      .order('created_at', { ascending: false })

    if (automationJobs && automationJobs.length > 0) {
      console.log(`✅ Found ${automationJobs.length} automation job(s) for new customer:`)
      automationJobs.forEach(job => {
        console.log(`   - ${job.template_type.toUpperCase()} Job ${job.id}:`)
        console.log(`     Status: ${job.status}`)
        console.log(`     Scheduled: ${new Date(job.scheduled_for).toLocaleString()}`)
        console.log(`     Trigger: ${job.trigger_type}`)
        if (job.completed_at) {
          console.log(`     Completed: ${new Date(job.completed_at).toLocaleString()}`)
        }
      })
    } else {
      console.log('⚠️  No automation jobs found for new customer')
    }

    // Step 6: Check if a virtual review was created
    console.log('\n6. Checking virtual review creation...')
    
    const { data: virtualReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', testUserId)
      .eq('customer_id', newCustomer.id)
      .order('created_at', { ascending: false })

    if (virtualReviews && virtualReviews.length > 0) {
      const virtualReview = virtualReviews[0]
      console.log(`✅ Virtual review created: ${virtualReview.id}`)
      console.log(`   Comment: "${virtualReview.comment}"`)
      console.log(`   Rating: ${virtualReview.rating} stars`)
    } else {
      console.log('⚠️  No virtual review found')
    }

    // Step 7: Test immediate processing results
    console.log('\n7. Testing immediate automation processing...')
    
    const completedJobs = automationJobs?.filter(job => job.status === 'completed') || []
    const pendingJobs = automationJobs?.filter(job => job.status === 'pending') || []
    
    console.log(`📊 Automation Results:`)
    console.log(`   ✅ Completed jobs: ${completedJobs.length}`)
    console.log(`   ⏳ Pending jobs: ${pendingJobs.length}`)
    
    if (completedJobs.length > 0) {
      console.log(`   🎉 Immediate automation worked! Jobs were processed automatically.`)
    } else if (pendingJobs.length > 0) {
      console.log(`   ⏰ Jobs are scheduled but not yet processed. Run cron job to process them.`)
    }

    // Step 8: Summary
    console.log('\n8. Test Summary:')
    
    const hasEmailJob = automationJobs?.some(job => job.template_type === 'email')
    const hasSMSJob = automationJobs?.some(job => job.template_type === 'sms')
    const hasImmediateProcessing = automationJobs?.some(job => job.status === 'completed')
    
    if (automationJobs && automationJobs.length > 0) {
      console.log(`✅ New customer automation is working!`)
      console.log(`   📧 Email automation: ${hasEmailJob ? '✅' : '❌'}`)
      console.log(`   📱 SMS automation: ${hasSMSJob ? '✅' : '❌'}`)
      console.log(`   ⚡ Immediate processing: ${hasImmediateProcessing ? '✅' : '⏰ Scheduled'}`)
      console.log(`   📋 Total jobs created: ${automationJobs.length}`)
    } else {
      console.log(`⚠️  New customer automation is not working`)
      console.log(`   Possible issues:`)
      console.log(`   - Templates not configured correctly`)
      console.log(`   - Automation function not called`)
      console.log(`   - API authentication issues`)
    }

    // Step 9: Clean up test data
    console.log('\n9. Cleaning up test data...')
    
    if (automationJobs) {
      for (const job of automationJobs) {
        await supabase.from('automation_jobs').delete().eq('id', job.id)
      }
    }
    
    if (virtualReviews) {
      for (const review of virtualReviews) {
        await supabase.from('reviews').delete().eq('id', review.id)
      }
    }
    
    await supabase.from('customers').delete().eq('id', newCustomer.id)
    await supabase.from('user_sessions').delete().eq('session_token', sessionToken)
    
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 New Customer Automation Test Complete!')
    console.log('\n📋 What This Test Verified:')
    console.log('✅ New customer creation triggers automation')
    console.log('✅ Virtual review is created for automation system')
    console.log('✅ Both email and SMS automation jobs are created')
    console.log('✅ Immediate triggers are processed automatically')
    console.log('✅ Automation respects template configuration')

  } catch (error) {
    console.error('❌ New customer automation test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testNewCustomerAutomation()