-- Reviews table for storing customer reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(500),
  comment TEXT,
  platform VARCHAR(100) NOT NULL,
  platform_review_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'pending', 'flagged', 'hidden')),
  response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  helpful_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  source VARCHAR(100) DEFAULT 'manual',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON reviews(customer_email);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own reviews" ON reviews
  FOR ALL USING (auth.uid()::text = user_id::text);
