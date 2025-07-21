CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT,
  customer_contact TEXT NOT NULL,
  contact_type TEXT NOT NULL, -- 'email' or 'sms'
  message_content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'clicked', 'reviewed'
  template_id UUID, -- Optional: reference to template_settings if a specific template was used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own review requests" ON review_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review requests" ON review_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
