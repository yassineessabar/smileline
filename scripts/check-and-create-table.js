#!/usr/bin/env node

/**
 * Script to check if the automation_jobs table exists and create it if needed
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAndCreateTable() {
  console.log('🔍 Checking if automation_jobs table exists...')
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('automation_jobs')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log('❌ automation_jobs table does not exist')
        console.log('📝 Creating automation_jobs table...')
        
        // Create the table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS automation_jobs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            review_id UUID,
            template_id UUID,
            template_type TEXT NOT NULL CHECK (template_type IN ('email', 'sms')),
            
            -- Customer information
            customer_id TEXT,
            customer_name TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            
            -- Scheduling information
            scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
            trigger_type TEXT NOT NULL,
            wait_days INTEGER DEFAULT 0,
            
            -- Job status
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
            
            -- Execution tracking
            processed_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            
            -- Metadata
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
        
        if (createError) {
          console.error('❌ Error creating table:', createError)
          return
        }
        
        console.log('✅ automation_jobs table created successfully!')
        
        // Create indexes
        const indexSQL = `
          CREATE INDEX IF NOT EXISTS idx_automation_jobs_user_id ON automation_jobs(user_id);
          CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
          CREATE INDEX IF NOT EXISTS idx_automation_jobs_scheduled_for ON automation_jobs(scheduled_for);
        `
        
        const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL })
        
        if (indexError) {
          console.log('⚠️  Warning: Could not create indexes:', indexError.message)
        } else {
          console.log('✅ Indexes created successfully!')
        }
        
      } else {
        console.error('❌ Error checking table:', error)
        return
      }
    } else {
      console.log('✅ automation_jobs table already exists')
    }
    
    // Test the table by counting records
    const { count, error: countError } = await supabase
      .from('automation_jobs')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error querying table:', countError)
    } else {
      console.log(`📊 Table has ${count} records`)
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

checkAndCreateTable()