-- Review templates for automated messaging
CREATE TABLE IF NOT EXISTS review_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms')),
  subject VARCHAR(500), -- For email templates
  content TEXT NOT NULL,
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON review_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON review_templates(type);

-- Enable RLS
ALTER TABLE review_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own templates" ON review_templates
  FOR ALL USING (auth.uid()::text = user_id::text);
