-- Automation workflows for review collection
CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(100) NOT NULL,
  trigger_conditions JSONB,
  actions JSONB NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON automation_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON automation_workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON automation_workflows(is_active);

-- Enable RLS
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own workflows" ON automation_workflows
  FOR ALL USING (auth.uid()::text = user_id::text);
