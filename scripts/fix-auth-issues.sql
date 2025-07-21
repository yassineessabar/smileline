-- This script cleans up existing demo data and sets up robust RLS policies for authentication.

-- Step 1: Clean up any existing demo user data to prevent conflicts.
-- This ensures a fresh start for the 'demo@loop.com' user.
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'demo@loop.com');
DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email = 'demo@loop.com');
DELETE FROM users WHERE email = 'demo@loop.com';

-- Step 2: Temporarily disable Row Level Security (RLS) to allow policy modifications.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing RLS policies for 'users' and 'user_sessions' tables.
-- This prevents conflicts with new policies and ensures a clean slate.
DROP POLICY IF EXISTS "Allow all operations for users" ON users;
DROP POLICY IF EXISTS "Allow all operations for sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow public signup" ON users;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow session creation" ON user_sessions;

-- Step 4: Re-insert the demo user with a known password hash for 'password123'.
-- This ensures the test login credentials are valid.
INSERT INTO users (id, email, password_hash, name, company, title, phone, store_type)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@loop.com',
  '$2b$10$rOvHPxfzAXp0rtymDNF09uoyHrDh2FL4Db7FXGJgOyFFs4wkmHBvW', -- Hashed 'password123'
  'Demo User',
  'Demo Company',
  'Manager',
  '+1234567890',
  'online'
);

-- Step 5: Re-enable RLS for both tables.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Step 6: Define granular RLS policies for the 'users' table.

-- Policy for SELECT: Allow both anonymous and authenticated users to read user data.
-- This is necessary for login (checking if a user exists) and signup (checking for existing emails).
CREATE POLICY "Allow read access for all users on users table"
ON users FOR SELECT
TO anon, authenticated
USING (true);

-- Policy for INSERT: Allow anonymous users to create new user accounts (signup).
CREATE POLICY "Allow anonymous users to sign up"
ON users FOR INSERT
TO anon
WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update their own profile.
-- The 'USING' clause restricts updates to the user's own ID, and 'WITH CHECK' ensures the updated row still meets this condition.
CREATE POLICY "Allow authenticated users to update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for DELETE: Allow authenticated users to delete their own profile.
CREATE POLICY "Allow authenticated users to delete their own profile"
ON users FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Step 7: Define granular RLS policies for the 'user_sessions' table.

-- Policy for SELECT: Allow authenticated users to read their own sessions.
CREATE POLICY "Allow authenticated users to read their own sessions"
ON user_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for INSERT: Allow both anonymous and authenticated users to create new sessions.
-- This is crucial for both signup and login processes to establish a session.
CREATE POLICY "Allow all users to create sessions"
ON user_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy for DELETE: Allow authenticated users to delete their own sessions (logout).
CREATE POLICY "Allow authenticated users to delete their own sessions"
ON user_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
