-- Insert demo user and sample data
INSERT INTO users (id, email, password_hash, name, company, title, phone, store_type) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@loop.com',
  '$2b$10$rOvHPxfzAXp0rtymDNF09uoyHrDh2FL4Db7FXGJgOyFFs4wkmHBvW', -- password123
  'Demo User',
  'Demo Company',
  'Manager',
  '+1234567890',
  'online'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo subscription
INSERT INTO subscriptions (user_id, plan_name, plan_type, amount, current_period_start, current_period_end, usage_limits)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Professional',
  'professional',
  79.00,
  NOW(),
  NOW() + INTERVAL '1 month',
  '{"reviews_per_month": 500, "integrations": 5}'
) ON CONFLICT (user_id) DO NOTHING;

-- Insert demo customization settings
INSERT INTO customization_settings (user_id, branding, messages, redirect_settings)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '{"companyLogo": "/loop-logo.png", "smsName": "Decathlon", "emailName": "Decathlon", "titleColor": "#e66465"}',
  '{"ratingPageContent": "Thank you for choosing our service! We hope you had a great experience.", "redirectText": "We are glad you had a good experience! If you could take a moment to leave a review, it would help us a lot.", "notificationText": "We are sorry you did not enjoy your experience. Could you give us more details about your experience with us?"}',
  '{"baseUrl": "moulai.io/redirect", "customId": "idnb", "fullUrl": "https://moulai.io/redirect/idnb"}'
) ON CONFLICT (user_id) DO NOTHING;

-- Insert demo notification settings
INSERT INTO notification_settings (user_id, email_notifications, review_alerts, weekly_reports)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  true,
  true,
  true
) ON CONFLICT (user_id) DO NOTHING;

-- Insert sample reviews
INSERT INTO reviews (user_id, customer_name, customer_email, rating, title, comment, platform, status, verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Sarah Johnson', 'sarah.j@email.com', 5, 'Excellent service!', 'I had an amazing experience with this company. The customer service was outstanding and the delivery was super fast. Highly recommend!', 'Google', 'published', true),
('550e8400-e29b-41d4-a716-446655440000', 'Mike Chen', 'mike.chen@email.com', 4, 'Good quality products', 'The products are of good quality and arrived on time. The only minor issue was the packaging could be better, but overall satisfied with my purchase.', 'Trustpilot', 'published', true),
('550e8400-e29b-41d4-a716-446655440000', 'Emma Wilson', 'emma.w@email.com', 2, 'Disappointed with the service', 'The delivery took much longer than expected and the customer service was not helpful when I tried to inquire about my order status.', 'Facebook', 'pending', false),
('550e8400-e29b-41d4-a716-446655440000', 'David Brown', 'david.b@email.com', 5, 'Perfect!', 'Everything was perfect from start to finish. Great products, fast shipping, and excellent customer support. Will definitely order again!', 'Google', 'published', true),
('550e8400-e29b-41d4-a716-446655440000', 'Lisa Garcia', 'lisa.g@email.com', 3, 'Average experience', 'The product was okay, nothing special. The price was fair but I expected a bit more quality for what I paid.', 'Trustpilot', 'published', true)
ON CONFLICT DO NOTHING;

-- Insert sample integrations
INSERT INTO integrations (user_id, platform, name, status, last_sync) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'google', 'Google My Business', 'connected', NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655440000', 'trustpilot', 'Trustpilot', 'connected', NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440000', 'slack', 'Slack Notifications', 'connected', NOW() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;
