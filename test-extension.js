// Simple extension test - paste this in Chrome console with extension popup open
console.log('🔍 Testing Tab Organizer AI Extension...');

// Check if scripts are loaded
console.log('Scripts check:', {
    configExists: typeof SecureConfigService !== 'undefined',
    supabaseExists: typeof SupabaseDataService !== 'undefined',
    popupExists: typeof TabOrganizerPopup !== 'undefined'
});

// Test by organizing tabs instead of direct class access
console.log('📝 Try clicking the "Organize" button now and watch console for Supabase logs...');

// Alternative: Check if popup object exists
setTimeout(() => {
    if (window.popup && window.popup.dataService) {
        console.log('✅ Popup data service found:', {
            configured: window.popup.dataService.isConfigured,
            hasUrl: !!window.popup.dataService.supabaseUrl,
            hasKey: !!window.popup.dataService.supabaseKey
        });
    } else {
        console.log('⚠️ Popup data service not found - try organizing tabs to trigger it');
    }
}, 1000);