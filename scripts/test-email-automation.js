#!/usr/bin/env node

/**
 * Test script for the email automation scheduler system
 * 
 * Usage:
 * node scripts/test-email-automation.js
 * 
 * This script will:
 * 1. Create a test email template with immediate trigger
 * 2. Create a test review to trigger automation
 * 3. Verify automation job was scheduled
 * 4. Process pending automations (in test mode)
 * 5. Clean up test data
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testEmailAutomation() {
  console.log('🧪 Testing Email Automation Scheduler')
  console.log('=====================================\\n')

  try {
    let testUserId = 'test-user-automation'
    let testReviewId = null
    let testTemplateCreated = false

    // Step 1: Create a test email template
    console.log('1. Creating test email template...')
    const templateResponse = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'email',
        data: {
          name: 'Test Email Template',
          subject: 'Test: We would love your feedback, {{customerName}}!',
          content: 'Hi {{customerName}},\\n\\nThank you for choosing {{companyName}}! We would love to hear about your experience.\\n\\nPlease leave us a review: {{reviewUrl}}\\n\\nBest regards,\\nThe {{companyName}} Team',
          fromEmail: 'test@example.com',
          sequence: [],
          initialTrigger: 'immediate',
          initialWaitDays: 0
        }
      })
    })

    if (templateResponse.ok) {
      console.log('✅ Test email template created successfully')
      testTemplateCreated = true
    } else {
      console.log('❌ Failed to create email template:', await templateResponse.text())
      return
    }

    // Step 2: Create a test review to trigger automation
    console.log('\\n2. Creating test review...')
    const reviewData = {
      user_id: testUserId,
      customer_id: `test_automation_${Date.now()}`,
      customer_name: 'Test Customer',
      customer_email: 'test.customer@example.com',
      rating: 5,
      comment: 'Test review for automation',
      platform: 'internal',
      status: 'published'
    }

    // First create via direct API call to simulate review creation
    const createReviewResponse = await fetch(`${baseUrl}/api/reviews/from-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: reviewData.customer_id,
        event_type: 'star_selection',
        star_rating: reviewData.rating,
        page: '/r/test-automation-link'
      })
    })

    if (createReviewResponse.ok) {
      const reviewResult = await createReviewResponse.json()
      testReviewId = reviewResult.data?.id
      console.log(`✅ Test review created: ${testReviewId}`)
    } else {
      console.log('❌ Failed to create test review:', await createReviewResponse.text())
      return
    }

    // Step 3: Check if automation was scheduled
    console.log('\\n3. Checking scheduled automation jobs...')
    const pendingJobsResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=list_pending`)
    const pendingJobsData = await pendingJobsResponse.json()
    
    if (pendingJobsData.success) {
      const userJobs = pendingJobsData.data.pendingJobs.filter(job => 
        job.user_id === testUserId || job.customer_email === reviewData.customer_email
      )
      
      console.log(`✅ Found ${userJobs.length} pending automation job(s) for test`)
      userJobs.forEach(job => {
        const scheduledTime = new Date(job.scheduled_for).toLocaleString()
        console.log(`   - Job ${job.id}: ${job.template_type} to ${job.customer_email} (scheduled: ${scheduledTime})`)
      })
      
      if (userJobs.length === 0) {
        console.log('⚠️  No automation jobs found for test user. This might indicate an issue.')
      }
    } else {
      console.log('❌ Error checking pending jobs:', pendingJobsData.error)
    }

    // Step 4: Process pending automations in test mode
    console.log('\\n4. Processing pending automations (test mode)...')
    
    const processResponse = await fetch(`${baseUrl}/api/automation/scheduler?action=process_pending&testMode=true`)
    const processData = await processResponse.json()
    
    if (processData.success) {
      const result = processData.data
      console.log('✅ Processing completed!')
      console.log(`   📊 Total processed: ${result.processedJobs}`)
      console.log(`   ✅ Successful: ${result.successfulJobs}`)
      console.log(`   ❌ Failed: ${result.failedJobs}`)
      
      if (result.results && result.results.length > 0) {
        console.log('\\n📋 Test Results:')
        result.results.forEach(job => {
          const status = job.success ? '✅' : '❌'
          console.log(`   ${status} Job ${job.jobId} (${job.type}) [TEST MODE]`)
          if (job.error) {
            console.log(`      Error: ${job.error}`)
          }
        })
      }
    } else {
      console.log('❌ Error processing automation:', processData.error)
    }

    // Step 5: Test immediate trigger via scheduler API
    if (testReviewId) {
      console.log('\\n5. Testing direct scheduler trigger...')
      const directScheduleResponse = await fetch(`${baseUrl}/api/automation/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: testReviewId
        })
      })

      if (directScheduleResponse.ok) {
        const scheduleResult = await directScheduleResponse.json()
        console.log('✅ Direct scheduling successful:', scheduleResult.data)
      } else {
        console.log('❌ Direct scheduling failed:', await directScheduleResponse.text())
      }
    }

    console.log('\\n🎉 Email automation test completed!')
    console.log('\\nNext steps:')
    console.log('- Set up a cron job to run: node scripts/process-automation-cron.js')
    console.log('- Configure SMTP settings in environment variables')
    console.log('- Test with real customer data')
    console.log('- Monitor automation job processing')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('\\nTroubleshooting:')
    console.log('- Make sure your Next.js server is running')
    console.log('- Check that the database is accessible')
    console.log('- Verify the automation_jobs table exists')
    console.log('- Ensure email_templates table has data')
  }
}

// Run the test
testEmailAutomation()