-- Complete SQL setup for review_link table and related functions

-- First, create the review_link table
CREATE TABLE public.review_link (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    review_url VARCHAR(255) NOT NULL UNIQUE,
    review_qr_code VARCHAR(50) NOT NULL UNIQUE,
    company_logo_url TEXT NULL,
    primary_color VARCHAR(7) NOT NULL DEFAULT '#e66465',
    secondary_color VARCHAR(7) NOT NULL DEFAULT '#9198e5',
    show_badge BOOLEAN NOT NULL DEFAULT true,
    rating_page_content TEXT NOT NULL DEFAULT 'How was your experience with {{companyName}}?',
    redirect_message TEXT NOT NULL DEFAULT 'Thank you for your feedback! Please click the button below to leave a review on {{platform}}.',
    internal_notification_message TEXT NOT NULL DEFAULT 'Thank you for your feedback! We appreciate you taking the time to share your thoughts.',
    video_upload_message TEXT NOT NULL DEFAULT 'Record a short video testimonial for {{companyName}}!',
    google_review_link TEXT NULL,
    trustpilot_review_link TEXT NULL,
    facebook_review_link TEXT NULL,
    enabled_platforms TEXT[] NOT NULL DEFAULT ARRAY['Google', 'Trustpilot']::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT review_link_pkey PRIMARY KEY (id),
    CONSTRAINT review_link_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT review_link_user_id_unique UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.review_link ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own review link settings" ON public.review_link
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own review link settings" ON public.review_link
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger (assuming you have the update_updated_at_column function)
CREATE TRIGGER update_review_link_updated_at
    BEFORE UPDATE ON public.review_link
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique review URL
CREATE OR REPLACE FUNCTION generate_unique_review_url()
RETURNS TEXT AS $$
DECLARE
    url_slug TEXT;
    base_url TEXT := 'https://loop-reviews.app/r/';
    full_url TEXT;
    url_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric string
        url_slug := substr(md5(random()::text), 1, 8);
        full_url := base_url || url_slug;
        
        -- Check if URL already exists
        SELECT EXISTS(SELECT 1 FROM public.review_link WHERE review_url = full_url) INTO url_exists;
        
        -- If URL doesn't exist, we can use it
        IF NOT url_exists THEN
            RETURN full_url;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique QR code identifier
CREATE OR REPLACE FUNCTION generate_unique_qr_code()
RETURNS TEXT AS $$
DECLARE
    qr_code TEXT;
    qr_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 12-character alphanumeric string for QR code
        qr_code := upper(substr(md5(random()::text), 1, 12));
        
        -- Check if QR code already exists
        SELECT EXISTS(SELECT 1 FROM public.review_link WHERE review_qr_code = qr_code) INTO qr_exists;
        
        -- If QR code doesn't exist, we can use it
        IF NOT qr_exists THEN
            RETURN qr_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to initialize review_link record for new users
CREATE OR REPLACE FUNCTION initialize_user_review_link()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.review_link (
        user_id,
        company_name,
        review_url,
        review_qr_code
    ) VALUES (
        NEW.id,
        COALESCE(NEW.company, 'Your Company'),
        generate_unique_review_url(),
        generate_unique_qr_code()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically initialize review_link record when user signs up
CREATE TRIGGER trigger_initialize_user_review_link
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_review_link();

-- Create indexes for better performance
CREATE INDEX idx_review_link_user_id ON public.review_link(user_id);
CREATE INDEX idx_review_link_review_url ON public.review_link(review_url);
CREATE INDEX idx_review_link_review_qr_code ON public.review_link(review_qr_code);

-- Optional: Create a record for existing users (run this if you have existing users)
-- INSERT INTO public.review_link (user_id, company_name, review_url, review_qr_code)
-- SELECT 
--     id, 
--     COALESCE(company, 'Your Company'),
--     generate_unique_review_url(),
--     generate_unique_qr_code()
-- FROM public.users 
-- WHERE id NOT IN (SELECT user_id FROM public.review_link);