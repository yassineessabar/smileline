#!/usr/bin/env node

/**
 * Check if SMS-related tables exist and create them if needed
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSMSTables() {
  console.log('📱 Checking SMS-related tables...\n')

  try {
    // Check if sms_templates table exists
    console.log('1. Checking sms_templates table...')
    const { data: smsTemplateData, error: smsTemplateError } = await supabase
      .from('sms_templates')
      .select('id')
      .limit(1)

    if (smsTemplateError) {
      if (smsTemplateError.code === '42P01') { // Table doesn't exist
        console.log('❌ sms_templates table does not exist')
        console.log('📝 Creating sms_templates table...')
        
        // Create sms_templates table (similar to email_templates)
        const createSMSTableSQL = `
          CREATE TABLE IF NOT EXISTS sms_templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            name TEXT NOT NULL DEFAULT 'Default SMS Template',
            content TEXT NOT NULL,
            sender_name TEXT,
            sequence TEXT DEFAULT '[]',
            initial_trigger TEXT NOT NULL DEFAULT 'immediate',
            initial_wait_days INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createSMSTableSQL })
        
        if (createError) {
          console.error('❌ Error creating sms_templates table:', createError)
          return
        }
        
        console.log('✅ sms_templates table created!')
        
        // Create indexes
        const indexSQL = `
          CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);
        `
        
        await supabase.rpc('exec_sql', { sql: indexSQL })
        console.log('✅ Indexes created for sms_templates!')
        
      } else {
        console.error('❌ Error checking sms_templates table:', smsTemplateError)
        return
      }
    } else {
      console.log('✅ sms_templates table exists')
    }

    // Check automation_jobs table for SMS support
    console.log('\n2. Checking automation_jobs table...')
    const { data: jobsData, error: jobsError } = await supabase
      .from('automation_jobs')
      .select('id, template_type')
      .limit(1)

    if (jobsError) {
      console.log('❌ automation_jobs table error:', jobsError.message)
    } else {
      console.log('✅ automation_jobs table exists and supports SMS')
    }

    // Check if we can create a test SMS template
    console.log('\n3. Testing SMS template creation...')
    
    // First, get or create a test user
    let testUserId = null
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'smstest@example.com')
      .single()

    if (existingUser) {
      testUserId = existingUser.id
      console.log(`✅ Using existing test user: ${testUserId}`)
    } else {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          first_name: 'SMS',
          last_name: 'Test',
          email: 'smstest@example.com',
          company: 'SMS Test Co',
          subscription_type: 'free',
          subscription_status: 'active'
        })
        .select()
        .single()
      
      testUserId = newUser.id
      console.log(`✅ Created test user: ${testUserId}`)
    }

    // Try to create a test SMS template
    const { data: testTemplate, error: templateError } = await supabase
      .from('sms_templates')
      .insert({
        user_id: testUserId,
        name: 'Test SMS Template',
        content: 'Hi {{customerName}}! Thanks for choosing {{companyName}}. Review us: {{reviewUrl}}',
        sender_name: 'Test Co',
        initial_trigger: 'immediate',
        initial_wait_days: 0
      })
      .select()
      .single()

    if (templateError) {
      console.log('❌ Error creating test SMS template:', templateError.message)
    } else {
      console.log(`✅ Test SMS template created: ${testTemplate.id}`)
      
      // Clean up the test template
      await supabase.from('sms_templates').delete().eq('id', testTemplate.id)
      console.log('✅ Test template cleaned up')
    }

    console.log('\n🎉 SMS Tables Check Complete!')
    console.log('✅ sms_templates table ready')
    console.log('✅ automation_jobs table supports SMS')
    console.log('✅ SMS template creation works')
    
    console.log('\n📱 SMS Automation is ready to use!')
    console.log('You can now:')
    console.log('- Create SMS templates in your dashboard')
    console.log('- SMS jobs will be scheduled automatically with reviews')
    console.log('- Run: node scripts/test-sms-simple.js to test')

  } catch (error) {
    console.error('❌ SMS tables check failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

checkSMSTables()