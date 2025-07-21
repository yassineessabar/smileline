-- User sessions for authentication management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow session creation" ON user_sessions;

-- RLS Policies
-- Allow anyone to insert sessions (for login/signup)
CREATE POLICY "Allow session creation" ON user_sessions
  FOR INSERT WITH CHECK (true);

-- Allow all users to read sessions for validation.
-- WARNING: This policy is permissive for demonstration purposes.
-- In a production environment, consider using Supabase's built-in auth
-- or the service_role key for secure session management.
CREATE POLICY "Allow all users to read sessions for validation" ON user_sessions
  FOR SELECT TO anon, authenticated USING (true);

-- Allow authenticated users to delete their own sessions (logout).
CREATE POLICY "Allow authenticated users to delete their own sessions"
  ON user_sessions FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id::text);
