-- Quick Fix for Supabase Data Not Showing
-- Run this in your Supabase SQL Editor

-- First, check if data exists
SELECT COUNT(*) as current_record_count FROM tab_categorizations;

-- Temporarily disable RLS for testing
ALTER TABLE tab_categorizations DISABLE ROW LEVEL SECURITY;

-- Test manual insert to verify database works
INSERT INTO tab_categorizations (cache_key, result, domain, category) 
VALUES (
    'manual-test-' || floor(extract(epoch from now())),
    jsonb_build_object(
        'category', 'test',
        'confidence', 'high', 
        'timestamp', floor(extract(epoch from now()) * 1000),
        'url', 'https://test.com',
        'domain', 'test.com'
    ),
    'test.com',
    'productivity'
);

-- Check if manual insert worked
SELECT * FROM tab_categorizations WHERE domain = 'test.com';

-- Re-enable RLS with more permissive policies
ALTER TABLE tab_categorizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON tab_categorizations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON tab_categorizations;
DROP POLICY IF EXISTS "Enable update access for all users" ON tab_categorizations;

-- Create new, more permissive policies
CREATE POLICY "Allow all operations for anon users" ON tab_categorizations
    FOR ALL USING (true) WITH CHECK (true);

-- Verify policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tab_categorizations';

-- Final test
SELECT 
    'Setup complete! Records found:' as status,
    COUNT(*) as total_records
FROM tab_categorizations;