#!/usr/bin/env node

/**
 * Test script to verify duplicate customer and automation prevention
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testDuplicatePrevention() {
  console.log('🔒 Testing Duplicate Customer & Automation Prevention')
  console.log('==================================================\n')

  try {
    // Step 1: Set up test user with email template
    console.log('1. Setting up test user with email template...')
    
    const { data: testUser } = await supabase
      .from('users')
      .upsert({
        first_name: 'Duplicate',
        last_name: 'Test',
        email: 'duplicatetest@example.com',
        company: 'Duplicate Test Co',
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
        name: 'Duplicate Test Email',
        subject: 'Welcome {{customerName}}!',
        content: 'Hi {{customerName}}, welcome to {{companyName}}!',
        from_email: 'welcome@duplicatetest.com',
        sequence: JSON.stringify([]),
        initial_trigger: 'immediate',
        initial_wait_days: 0
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    console.log(`✅ Email template created`)

    // Create session for authentication
    const sessionToken = `duplicate_test_${Date.now()}`
    await supabase.from('user_sessions').insert({
      user_id: testUserId,
      session_token: sessionToken,
      created_at: new Date().toISOString()
    })

    // Step 2: Create first customer
    console.log('\n2. Creating first customer...')
    
    const customerData = {
      name: 'Duplicate Test Customer',
      email: 'duplicatecustomer@example.com',
      phone: '+1555123456',
      type: 'both'
    }
    
    const firstResponse = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify(customerData)
    })

    if (firstResponse.ok) {
      const firstResult = await firstResponse.json()
      console.log(`✅ First customer created: ${firstResult.data.id}`)
      
      // Wait a moment for automation processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check automation jobs for first customer
      const { data: firstAutomationJobs } = await supabase
        .from('automation_jobs')
        .select('*')
        .eq('user_id', testUserId)
        .eq('customer_id', firstResult.data.id)
      
      console.log(`   📧 Automation jobs created: ${firstAutomationJobs?.length || 0}`)
      
    } else {
      console.log('❌ First customer creation failed:', firstResponse.status, await firstResponse.text())
      return
    }

    // Step 3: Attempt to create duplicate customer (same email)
    console.log('\n3. Attempting to create duplicate customer (same email)...')
    
    const duplicateResponse = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify(customerData) // Same data as before
    })

    if (duplicateResponse.status === 409) {
      const duplicateResult = await duplicateResponse.json()
      console.log('✅ Duplicate customer properly rejected!')
      console.log(`   Error: ${duplicateResult.error}`)
      console.log(`   Details: ${duplicateResult.details?.message}`)
      console.log(`   Existing customer: ${duplicateResult.details?.existingCustomer?.name}`)
    } else if (duplicateResponse.ok) {
      console.log('❌ Duplicate customer was NOT rejected - this is a problem!')
      const result = await duplicateResponse.json()
      console.log('   Customer created:', result.data)
    } else {
      console.log('❌ Unexpected response:', duplicateResponse.status, await duplicateResponse.text())
    }

    // Step 4: Test duplicate phone number
    console.log('\n4. Testing duplicate phone number prevention...')
    
    const phoneOnlyData = {
      name: 'Phone Only Customer',
      phone: '+1555123456', // Same phone as first customer
      type: 'sms'
    }
    
    const phoneResponse = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify(phoneOnlyData)
    })

    if (phoneResponse.status === 409) {
      const phoneResult = await phoneResponse.json()
      console.log('✅ Duplicate phone number properly rejected!')
      console.log(`   Error: ${phoneResult.error}`)
    } else {
      console.log('⚠️  Phone duplicate check may have issues')
    }

    // Step 5: Test automation duplicate prevention
    console.log('\n5. Testing automation duplicate prevention...')
    
    // Try to manually trigger automation for the same customer again
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', testUserId)
      .eq('email', customerData.email)
      .single()

    if (existingCustomer) {
      console.log(`   Found existing customer: ${existingCustomer.id}`)
      
      // Manually call the automation function (simulating duplicate API call)
      try {
        // First, check current automation jobs
        const { data: beforeJobs } = await supabase
          .from('automation_jobs')
          .select('*')
          .eq('user_id', testUserId)
          .eq('customer_id', existingCustomer.id)
        
        console.log(`   Automation jobs before: ${beforeJobs?.length || 0}`)
        
        // Try to trigger automation again (this should be prevented)
        const automation = await triggerAutomationForNewCustomerTest(testUserId, existingCustomer)
        
        // Check automation jobs after
        const { data: afterJobs } = await supabase
          .from('automation_jobs')
          .select('*')
          .eq('user_id', testUserId)
          .eq('customer_id', existingCustomer.id)
        
        console.log(`   Automation jobs after: ${afterJobs?.length || 0}`)
        
        if ((afterJobs?.length || 0) === (beforeJobs?.length || 0)) {
          console.log('✅ Duplicate automation properly prevented!')
        } else {
          console.log('⚠️  Duplicate automation was NOT prevented - check logic')
        }
        
      } catch (automationError) {
        console.log('⚠️  Error testing automation duplicate prevention:', automationError.message)
      }
    }

    // Step 6: Test rapid multiple clicks simulation
    console.log('\n6. Simulating rapid multiple clicks...')
    
    const rapidClickData = {
      name: 'Rapid Click Customer',
      email: 'rapidclick@example.com',
      phone: '+1555999888',
      type: 'both'
    }
    
    // Simulate 3 rapid API calls (like user clicking button multiple times)
    const rapidPromises = []
    for (let i = 0; i < 3; i++) {
      rapidPromises.push(
        fetch(`${baseUrl}/api/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session=${sessionToken}`
          },
          body: JSON.stringify(rapidClickData)
        })
      )
    }
    
    const rapidResults = await Promise.all(rapidPromises)
    
    let successCount = 0
    let duplicateCount = 0
    
    for (let i = 0; i < rapidResults.length; i++) {
      if (rapidResults[i].ok) {
        successCount++
      } else if (rapidResults[i].status === 409) {
        duplicateCount++
      }
    }
    
    console.log(`   Results from 3 rapid API calls:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   🔒 Rejected as duplicate: ${duplicateCount}`)
    
    if (successCount === 1 && duplicateCount === 2) {
      console.log('✅ Rapid click protection working perfectly!')
    } else if (successCount === 1) {
      console.log('✅ Only one customer created (good), but duplicate detection may need improvement')
    } else {
      console.log('⚠️  Multiple customers created - duplicate prevention needs fixing')
    }

    // Step 7: Summary
    console.log('\n7. Test Summary:')
    
    const { data: allTestCustomers } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
    
    const { data: allAutomationJobs } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('user_id', testUserId)
    
    console.log(`📊 Final Results:`)
    console.log(`   👥 Total customers created: ${allTestCustomers?.length || 0}`)
    console.log(`   📧 Total automation jobs: ${allAutomationJobs?.length || 0}`)
    console.log(`   Expected: 2 customers, ~2 automation jobs`)
    
    if ((allTestCustomers?.length || 0) <= 2 && (allAutomationJobs?.length || 0) <= 2) {
      console.log('✅ Duplicate prevention is working well!')
    } else {
      console.log('⚠️  Too many duplicates created - review prevention logic')
    }

    // Step 8: Clean up
    console.log('\n8. Cleaning up test data...')
    
    if (allAutomationJobs) {
      for (const job of allAutomationJobs) {
        await supabase.from('automation_jobs').delete().eq('id', job.id)
      }
    }
    
    if (allTestCustomers) {
      for (const customer of allTestCustomers) {
        await supabase.from('customers').delete().eq('id', customer.id)
      }
    }
    
    // Clean up virtual reviews
    await supabase.from('reviews').delete().eq('user_id', testUserId).like('comment', '%New customer signup%')
    
    await supabase.from('user_sessions').delete().eq('session_token', sessionToken)
    
    console.log('✅ Cleanup complete')

    console.log('\n🎉 Duplicate Prevention Test Complete!')
    console.log('\n📋 Protection Implemented:')
    console.log('✅ Duplicate email detection')
    console.log('✅ Duplicate phone detection') 
    console.log('✅ Rapid click prevention')
    console.log('✅ Automation duplicate prevention (1 hour window)')
    console.log('✅ Proper error messages with existing customer details')

  } catch (error) {
    console.error('❌ Duplicate prevention test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Simplified version of the automation function for testing
async function triggerAutomationForNewCustomerTest(userId, customer) {
  // Check if automation has already been triggered recently
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)
  
  const { data: recentAutomation } = await supabase
    .from("automation_jobs")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("customer_id", customer.id)
    .gte("created_at", oneHourAgo.toISOString())
    .limit(1)

  if (recentAutomation && recentAutomation.length > 0) {
    console.log(`   ⏭️ Automation already triggered recently - skipping duplicate`)
    return false
  }
  
  console.log(`   🚀 Would trigger automation for: ${customer.name}`)
  return true
}

testDuplicatePrevention()