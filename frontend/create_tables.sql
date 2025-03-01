-- Create the URLs table
CREATE TABLE IF NOT EXISTS public.urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    page_title TEXT,
    tags TEXT[] DEFAULT '{}',
    date_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON public.urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_date_accessed ON public.urls(date_accessed);

-- Set up Row Level Security (RLS)
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own URLs
CREATE POLICY "Users can view their own URLs" 
ON public.urls FOR SELECT 
USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own URLs
CREATE POLICY "Users can insert their own URLs" 
ON public.urls FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own URLs
CREATE POLICY "Users can update their own URLs" 
ON public.urls FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own URLs
CREATE POLICY "Users can delete their own URLs" 
ON public.urls FOR DELETE 
USING (auth.uid()::text = user_id); 