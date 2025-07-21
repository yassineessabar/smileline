CREATE TABLE IF NOT EXISTS template_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'sms_template', 'email_template', 'sms_reminder_3', 'sms_reminder_7', 'email_reminder_3', 'email_reminder_7'
  sender_name TEXT, -- For SMS
  sender_email TEXT, -- For Email
  subject TEXT, -- For Email
  content TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE, -- For reminders
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE template_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own template settings" ON template_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own template settings" ON template_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own template settings" ON template_settings
  FOR UPDATE USING (auth.uid() = user_id);
