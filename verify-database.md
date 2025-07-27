# Database Verification Steps

## 1. Check Users Table Structure

Run this SQL in your Supabase SQL Editor:

```sql
-- Check what columns exist in users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

## 2. Check Recent User Updates

```sql
-- Check the most recent user records
SELECT 
  id, 
  email, 
  company, 
  store_type, 
  updated_at,
  created_at
FROM users 
ORDER BY updated_at DESC 
LIMIT 10;
```

## 3. Check Specific User from Logs

Based on your logs, check this specific user:

```sql
-- Check the user from the logs
SELECT * FROM users 
WHERE id = '87b41042-8f6a-475b-9651-0d343fa8f491';
```

## 4. Check for Schema Issues

```sql
-- Verify the users table has the expected columns
SELECT 
  CASE 
    WHEN column_name = 'company' THEN '✅ company column exists'
    WHEN column_name = 'store_type' THEN '✅ store_type column exists'
    ELSE column_name
  END as column_check
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('company', 'store_type');
```

## Expected Results

Based on the API logs, you should see:
- **company**: "22121" 
- **store_type**: "Retail & ecommerce"
- **updated_at**: Recent timestamp

## If Data is Missing

1. **Wrong field names**: The API might be updating different field names than expected
2. **RLS policies**: Row Level Security might be preventing updates
3. **Triggers**: Database triggers might be modifying the data
4. **Cache issues**: You might be looking at cached data

## Quick Test

Try this simple update to verify the database connection:

```sql
-- Test direct update (replace with actual user ID)
UPDATE users 
SET company = 'MANUAL_TEST_' || NOW()::text
WHERE id = '87b41042-8f6a-475b-9651-0d343fa8f491';

-- Then check if it worked
SELECT company FROM users 
WHERE id = '87b41042-8f6a-475b-9651-0d343fa8f491';
```

## Alternative Field Names

The API logs show these fields, but check if your database uses different names:
- `company` vs `company_name`
- `store_type` vs `business_category` 
- `store_type` vs `category`