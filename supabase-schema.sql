-- Tab Organizer AI - Supabase Database Schema
-- Run this SQL in your Supabase SQL editor to set up the database

-- Create the tab_categorizations table
CREATE TABLE IF NOT EXISTS tab_categorizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    result JSONB NOT NULL,
    domain TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tab_categorizations_cache_key ON tab_categorizations(cache_key);
CREATE INDEX IF NOT EXISTS idx_tab_categorizations_domain ON tab_categorizations(domain);
CREATE INDEX IF NOT EXISTS idx_tab_categorizations_category ON tab_categorizations(category);
CREATE INDEX IF NOT EXISTS idx_tab_categorizations_created_at ON tab_categorizations(created_at);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tab_categorizations_updated_at ON tab_categorizations;
CREATE TRIGGER update_tab_categorizations_updated_at
    BEFORE UPDATE ON tab_categorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tab_categorizations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust based on your authentication needs)
-- For anonymous access (basic setup):
CREATE POLICY "Enable read access for all users" ON tab_categorizations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON tab_categorizations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON tab_categorizations
    FOR UPDATE USING (true);

-- Optional: Create a view for analytics
CREATE OR REPLACE VIEW categorization_stats AS
SELECT 
    category,
    domain,
    COUNT(*) as usage_count,
    MAX(created_at) as last_used,
    MIN(created_at) as first_used
FROM tab_categorizations
GROUP BY category, domain
ORDER BY usage_count DESC;

-- Optional: Create function to clean up old entries (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_categorizations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tab_categorizations 
    WHERE created_at < now() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE tab_categorizations IS 'Stores AI categorization results for tab organization caching';
COMMENT ON COLUMN tab_categorizations.cache_key IS 'Unique identifier generated from URL, title, and content hash';
COMMENT ON COLUMN tab_categorizations.result IS 'Complete categorization result with metadata';
COMMENT ON COLUMN tab_categorizations.domain IS 'Extracted domain for pattern matching';
COMMENT ON COLUMN tab_categorizations.category IS 'Assigned category name';

-- Create a sample query to check the setup
-- SELECT 
--     'Setup completed successfully!' as status,
--     COUNT(*) as total_entries
-- FROM tab_categorizations;