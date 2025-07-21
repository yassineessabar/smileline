-- Insert demo user (password is 'password123' hashed)
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

-- Insert sample reviews for demo user
INSERT INTO reviews (user_id, customer_name, customer_email, rating, title, comment, platform, status, verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Sarah Johnson', 'sarah.j@email.com', 5, 'Excellent service!', 'I had an amazing experience with this company. The customer service was outstanding and the delivery was super fast. Highly recommend!', 'Google', 'published', true),
('550e8400-e29b-41d4-a716-446655440000', 'Mike Chen', 'mike.chen@email.com', 4, 'Good quality products', 'The products are of good quality and arrived on time. The only minor issue was the packaging could be better, but overall satisfied with my purchase.', 'Trustpilot', 'published', true),
('550e8400-e29b-41d4-a716-446655440000', 'Emma Wilson', 'emma.w@email.com', 2, 'Disappointed with the service', 'The delivery took much longer than expected and the customer service was not helpful when I tried to inquire about my order status.', 'Facebook', 'pending', false),
('550e8400-e29b-41d4-a716-446655440000', 'David Brown', 'david.b@email.com', 5, 'Perfect!', 'Everything was perfect from start to finish. Great products, fast shipping, and excellent customer support. Will definitely order again!', 'Google', 'published', true),
('550e8400-e29b-41d4-a716-446655440000', 'Lisa Garcia', 'lisa.g@email.com', 3, 'Average experience', 'The product was okay, nothing special. The price was fair but I expected a bit more quality for what I paid.', 'Trustpilot', 'published', true)
ON CONFLICT DO NOTHING;
