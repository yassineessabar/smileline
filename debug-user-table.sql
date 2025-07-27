-- Debug users table structure and data
-- Run this in your Supabase SQL Editor to check what's actually in the database

-- 1. Check the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check recent user records (last 5 users)
SELECT id, email, company, store_type, created_at, updated_at 
FROM users 
ORDER BY updated_at DESC 
LIMIT 5;

-- 3. Check specific user from the logs (if you have the ID)
-- Replace 'USER_ID_HERE' with the actual user ID from the logs
-- SELECT * FROM users WHERE id = '87b41042-8f6a-475b-9651-0d343fa8f491';

-- 4. Check if there are any triggers or policies affecting updates
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users';