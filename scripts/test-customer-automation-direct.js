#!/usr/bin/env node

/**
 * Direct test of new customer automation function
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCustomerAutomationDirect() {
  console.log('👤 Testing New Customer Automation (Direct)')
  console.log('==========================================\n')

  try {
    // Step 1: Set up test user with immediate email template
    console.log('1. Setting up test user with immediate email template...')
    
    const { data: testUser } = await supabase
      .from('users')
      .upsert({
        first_name: 'DirectTest',
        last_name: 'User',
        email: 'directtest@example.com',
        company: 'Direct Test Co',
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
        name: 'Direct Test Welcome Email',
        subject: 'Welcome {{customerName}}!',
        content: 'Hi {{customerName}}, welcome to {{companyName}}! 🎉',
        from_email: 'welcome@directtest.com',
        sequence: JSON.stringify([]),
        initial_trigger: 'immediate',
        initial_wait_days: 0
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    console.log(`✅ Email template created with immediate trigger`)

    // Step 2: Create a test customer directly in database
    console.log('\n2. Creating test customer directly...')
    
    const { data: testCustomer } = await supabase
      .from('customers')
      .insert({
        user_id: testUserId,
        name: 'Direct Test Customer',
        email: 'directcustomer@example.com',
        phone: '+1987654321',
        type: 'both',
        status: 'active'
      })
      .select()
      .single()

    console.log(`✅ Test customer created: ${testCustomer.id}`)

    // Step 3: Manually call the automation function
    console.log('\n3. Manually triggering automation function...')
    
    // Import and replicate the automation logic
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Check if templates exist
    const { data: emailCheck } = await supabase
      .from("email_templates")
      .select("*")
      .eq("user_id", testUserId)
      .single()

    const { data: smsCheck } = await supabase
      .from("sms_templates")
      .select("*")
      .eq("user_id", testUserId)
      .single()

    console.log(`📧 Email template found: ${emailCheck ? '✅' : '❌'}`)
    console.log(`📱 SMS template found: ${smsCheck ? '✅' : '❌'}`)

    if (emailCheck) {
      console.log(`   Email trigger: ${emailCheck.initial_trigger}`)
      console.log(`   Email wait days: ${emailCheck.initial_wait_days}`)
    }

    // Create virtual review for automation
    const { data: virtualReview } = await supabase
      .from("reviews")
      .insert({
        user_id: testUserId,
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        customer_email: testCustomer.email,
        rating: 5,
        comment: `New customer signup: ${testCustomer.name}`,
        platform: "internal",
        status: "published"
      })
      .select()
      .single()

    console.log(`✅ Virtual review created: ${virtualReview.id}`)

    // Step 4: Call scheduler API
    console.log('\n4. Calling scheduler API...')
    
    const schedulerResponse = await fetch(`${baseUrl}/api/automation/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewId: virtualReview.id
      })
    })

    if (schedulerResponse.ok) {
      const schedulerResult = await schedulerResponse.json()
      console.log('✅ Scheduler API successful:')
      console.log(`   Jobs scheduled: ${schedulerResult.data.processedJobs}`)
      
      if (schedulerResult.data.results) {
        schedulerResult.data.results.forEach(result => {
          console.log(`   - Result: ${result.success ? '✅' : '❌'} (${result.jobsScheduled} jobs)`)
        })
      }
    } else {
      console.log('❌ Scheduler API failed:', schedulerResponse.status, await schedulerResponse.text())
    }

    // Step 5: Check automation jobs
    console.log('\n5. Checking automation jobs...')
    
    const { data: automationJobs } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('user_id', testUserId)
      .eq('customer_id', testCustomer.id)
      .order('created_at', { ascending: false })

    if (automationJobs && automationJobs.length > 0) {
      console.log(`✅ Found ${automationJobs.length} automation job(s):`)
      automationJobs.forEach(job => {
        console.log(`   - ${job.template_type.toUpperCase()} Job ${job.id}:`)
        console.log(`     Status: ${job.status}`)
        console.log(`     Trigger: ${job.trigger_type}`)
        console.log(`     Scheduled: ${new Date(job.scheduled_for).toLocaleString()}`)
      })
      
      // Step 6: Process immediate jobs
      const immediateJobs = automationJobs.filter(job => 
        job.trigger_type === 'immediate' && job.status === 'pending'
      )
      
      if (immediateJobs.length > 0) {
        console.log(`\n6. Processing ${immediateJobs.length} immediate job(s)...`)
        
        const processResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=true`)
        
        if (processResponse.ok) {
          const processResult = await processResponse.json()
          console.log('✅ Processing result:')
          console.log(`   Processed: ${processResult.data?.processedJobs || 0}`)
          console.log(`   Successful: ${processResult.data?.successfulJobs || 0}`)
          
          if (processResult.data?.results) {
            processResult.data.results.forEach(result => {
              const status = result.success ? '✅' : '❌'
              console.log(`   ${status} ${result.type.toUpperCase()} Job ${result.jobId} [TEST]`)
            })
          }
        } else {
          console.log('❌ Processing failed:', await processResponse.text())
        }
      }
      
    } else {
      console.log('⚠️  No automation jobs found')
    }

    // Step 7: Final summary
    console.log('\n7. Test Summary:')
    
    if (automationJobs && automationJobs.length > 0) {
      const emailJobs = automationJobs.filter(job => job.template_type === 'email')
      const smsJobs = automationJobs.filter(job => job.template_type === 'sms')
      const immediateJobs = automationJobs.filter(job => job.trigger_type === 'immediate')
      
      console.log(`✅ New customer automation is working!`)
      console.log(`   📧 Email jobs: ${emailJobs.length}`)
      console.log(`   📱 SMS jobs: ${smsJobs.length}`)  
      console.log(`   ⚡ Immediate jobs: ${immediateJobs.length}`)
      console.log(`   📋 Total jobs: ${automationJobs.length}`)
    } else {
      console.log(`❌ New customer automation is not working`)
    }

    // Step 8: Clean up
    console.log('\n8. Cleaning up test data...')
    
    if (automationJobs) {
      for (const job of automationJobs) {
        await supabase.from('automation_jobs').delete().eq('id', job.id)
      }
    }
    
    await supabase.from('reviews').delete().eq('id', virtualReview.id)
    await supabase.from('customers').delete().eq('id', testCustomer.id)
    
    console.log('✅ Cleanup complete')

    console.log('\n🎉 Direct Customer Automation Test Complete!')

  } catch (error) {
    console.error('❌ Direct test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testCustomerAutomationDirect()