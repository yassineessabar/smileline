#!/usr/bin/env node

/**
 * Test script for the email automation system
 * 
 * Usage:
 * node scripts/test-automation.js
 * 
 * This script will:
 * 1. Check the automation system status
 * 2. List available workflows
 * 3. Test automation with the latest review
 * 4. Create a test review and trigger automation
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testAutomationSystem() {
  console.log('🧪 Testing Email Automation System')
  console.log('==================================\n')

  try {
    // 1. Check system status
    console.log('1. Checking automation system status...')
    const statusResponse = await fetch(`${baseUrl}/api/automation/test?action=status`)
    const statusData = await statusResponse.json()
    
    if (statusData.success) {
      console.log('✅ Automation system is active')
      console.log(`   Available actions: ${statusData.data.availableActions.join(', ')}`)
    } else {
      console.log('❌ Automation system error:', statusData.error)
      return
    }

    console.log('\n2. Listing active workflows...')
    const workflowsResponse = await fetch(`${baseUrl}/api/automation/test?action=list_workflows`)
    const workflowsData = await workflowsResponse.json()
    
    if (workflowsData.success) {
      const workflows = workflowsData.data.workflows
      console.log(`✅ Found ${workflows.length} active workflow(s):`)
      workflows.forEach(workflow => {
        console.log(`   - ${workflow.name} (${workflow.trigger_event}) - ${workflow.is_active ? 'Active' : 'Inactive'}`)
      })
      
      if (workflows.length === 0) {
        console.log('⚠️  No workflows found. Create some workflows in the dashboard first.')
      }
    } else {
      console.log('❌ Error listing workflows:', workflowsData.error)
    }

    console.log('\n3. Testing with latest review...')
    const testResponse = await fetch(`${baseUrl}/api/automation/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test_latest_review'
      })
    })
    
    const testData = await testResponse.json()
    
    if (testData.success) {
      const review = testData.data.reviewTested
      const automation = testData.data.automationResult
      
      console.log('✅ Test completed successfully!')
      console.log(`   Review tested: ID ${review.id}, ${review.rating} stars, "${review.customer_name}"`)
      console.log(`   Workflows triggered: ${automation.workflowsTriggered}`)
      
      if (automation.workflows) {
        automation.workflows.forEach(workflow => {
          const status = workflow.success ? '✅' : '❌'
          console.log(`   ${status} ${workflow.workflowName} (${workflow.type || 'unknown'})`)
          if (workflow.testMode) {
            console.log(`      [TEST MODE] Would send to: ${workflow.recipient}`)
          }
          if (workflow.error) {
            console.log(`      Error: ${workflow.error}`)
          }
        })
      }
    } else {
      console.log('❌ Test failed:', testData.error)
    }

    console.log('\n4. Creating and testing a new review...')
    const createTestResponse = await fetch(`${baseUrl}/api/automation/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_test_review'
      })
    })
    
    const createTestData = await createTestResponse.json()
    
    if (createTestData.success) {
      const testReview = createTestData.data.testReview
      const automation = createTestData.data.automationResult
      
      console.log('✅ Test review created and automation triggered!')
      console.log(`   Test review: ID ${testReview.id}, ${testReview.rating} stars`)
      console.log(`   Workflows triggered: ${automation.workflowsTriggered}`)
      
      if (automation.workflows) {
        automation.workflows.forEach(workflow => {
          const status = workflow.success ? '✅' : '❌'
          console.log(`   ${status} ${workflow.workflowName}`)
          if (workflow.testMode) {
            console.log(`      [TEST MODE] Would send to: ${workflow.recipient}`)
          }
        })
      }
    } else {
      console.log('❌ Failed to create test review:', createTestData.error)
    }

    console.log('\n🎉 Automation testing complete!')
    console.log('\nNext steps:')
    console.log('- Ensure SMTP settings are configured in your environment variables')
    console.log('- Create automation workflows in the dashboard')
    console.log('- Test with real reviews by using star ratings in the review link')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('\nTroubleshooting:')
    console.log('- Make sure your Next.js server is running')
    console.log('- Check that the database is accessible')
    console.log('- Verify environment variables are set')
  }
}

// Run the test
testAutomationSystem()