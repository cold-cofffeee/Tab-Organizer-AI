// Debug Supabase Connection Test
console.log('🔍 Testing Supabase connection...');

// Test 1: Check if config is loaded
try {
    const configService = new SecureConfigService();
    const config = configService.getConfig();
    console.log('✅ Config loaded:', {
        hasUrl: !!config.url,
        hasKey: !!config.key,
        urlEndsWith: config.url?.slice(-20),
        keyStartsWith: config.key?.slice(0, 20)
    });
} catch (error) {
    console.error('❌ Config error:', error);
}

// Test 2: Check if Supabase service initializes
try {
    const supabaseService = new SupabaseDataService();
    console.log('✅ Supabase service created');
    
    // Wait a moment for async initialization
    setTimeout(async () => {
        console.log('🔍 Checking service configuration...');
        console.log('isConfigured:', supabaseService.isConfigured);
        console.log('supabaseUrl:', supabaseService.supabaseUrl?.slice(-30));
        console.log('hasKey:', !!supabaseService.supabaseKey);
        
        // Test 3: Test connection
        if (supabaseService.isConfigured) {
            try {
                const testResult = await supabaseService.testConnection();
                console.log('✅ Connection test result:', testResult);
            } catch (error) {
                console.error('❌ Connection test failed:', error);
            }
            
            // Test 4: Try to store a test record
            try {
                const testTabData = {
                    url: 'https://example.com/test',
                    title: 'Test Page',
                    content: 'Test content for debugging'
                };
                
                console.log('🔍 Testing data storage...');
                const result = await supabaseService.storeCategorization(testTabData, 'productivity');
                console.log('✅ Test storage result:', result);
                
            } catch (error) {
                console.error('❌ Storage test failed:', error);
            }
        } else {
            console.error('❌ Service not configured properly');
        }
    }, 1000);
    
} catch (error) {
    console.error('❌ Supabase service error:', error);
}

console.log('🔍 Debug script loaded. Check console for results...');