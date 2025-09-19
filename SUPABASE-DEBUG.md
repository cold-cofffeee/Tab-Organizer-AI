# 🔍 Supabase Data Not Showing - Troubleshooting Guide

## Quick Diagnosis Steps

### 1. **Test the Debug Script**
1. Open Chrome DevTools (F12) 
2. Go to the extension popup
3. In DevTools Console, paste and run:
```javascript
// Load our debug script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('debug-supabase.js');
document.head.appendChild(script);
```

### 2. **Check Supabase Configuration**
In your Supabase dashboard:

1. **Verify Project URL**: Should be `https://uabxzkjrnvhiucmkqnnd.supabase.co`
2. **Check API Keys**: 
   - Anon key should start with `eyJhbG...`
   - Service role should start with `eyJhbG...`
3. **Table exists**: Go to Table Editor → should see `tab_categorizations`

### 3. **Test Database Access Manually**
In Supabase SQL Editor, run:
```sql
-- Test 1: Check if table exists
SELECT * FROM tab_categorizations LIMIT 5;

-- Test 2: Test manual insert
INSERT INTO tab_categorizations (cache_key, result, domain, category) 
VALUES ('test-key-123', '{"test": true}', 'example.com', 'test');

-- Test 3: Check if insert worked
SELECT * FROM tab_categorizations WHERE cache_key = 'test-key-123';
```

### 4. **Common Issues & Solutions**

#### **Issue A: RLS Blocking Inserts**
**Solution**: Temporarily disable RLS for testing:
```sql
ALTER TABLE tab_categorizations DISABLE ROW LEVEL SECURITY;
-- Test the extension, then re-enable:
ALTER TABLE tab_categorizations ENABLE ROW LEVEL SECURITY;
```

#### **Issue B: API Key Permissions**
**Problem**: Anon key might not have INSERT permissions
**Solution**: Use service role key for inserts. Check our config:
- We're using anon key for both read/write
- Should work with our RLS policies

#### **Issue C: CORS Issues**
**Problem**: Browser blocking requests
**Solution**: Check Network tab in DevTools for failed requests

#### **Issue D: Extension Not Using Supabase**
**Problem**: Falling back to local cache only
**Solution**: Check console for "Configuration validation failed" messages

### 5. **Enable Debug Logging**
Add this to see what's happening:

```javascript
// In Chrome console, enable verbose logging:
console.log('🔧 Enabling debug mode...');
window.supabaseDebug = true;
```

### 6. **Check Network Activity**
1. Open DevTools → Network tab
2. Try organizing some tabs
3. Look for requests to `supabase.co`
4. Check if they're returning errors (red status codes)

### 7. **Most Likely Issues**

1. **RLS Policies**: Too restrictive
2. **API Key**: Wrong permissions or expired
3. **Table Schema**: Column mismatch
4. **Extension Config**: Not initializing properly

### 8. **Quick Fix to Test**
If you want to quickly test if everything works, run this in Supabase SQL Editor:

```sql
-- Temporarily disable RLS
ALTER TABLE tab_categorizations DISABLE ROW LEVEL SECURITY;

-- Manual test insert
INSERT INTO tab_categorizations (cache_key, result, domain, category, created_at) 
VALUES (
    'manual-test-' || extract(epoch from now()),
    '{"category": "test", "confidence": "high", "timestamp": ' || extract(epoch from now() * 1000) || '}',
    'test.com', 
    'productivity',
    now()
);

-- Check if it worked
SELECT COUNT(*) as total_records FROM tab_categorizations;
```

If this works, the issue is likely with the extension configuration or RLS policies.

## Next Steps
1. Run the debug script first
2. Check the console output
3. Try the manual SQL test
4. Report back what you see!