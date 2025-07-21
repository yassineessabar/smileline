-- Customization settings for branding and UI
CREATE TABLE IF NOT EXISTS customization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  branding JSONB DEFAULT '{}',
  messages JSONB DEFAULT '{}',
  redirect_settings JSONB DEFAULT '{}',
  theme_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customization_user_id ON customization_settings(user_id);

-- Enable RLS
ALTER TABLE customization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own customization" ON customization_settings
  FOR ALL USING (auth.uid()::text = user_id::text);
