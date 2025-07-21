-- Notification settings for user preferences
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  review_alerts BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own notification settings" ON notification_settings
  FOR ALL USING (auth.uid()::text = user_id::text);
