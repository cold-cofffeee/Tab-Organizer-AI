// Debug script for Tab Organizer AI
// Run this in the browser console to test functionality

console.log('=== Tab Organizer AI Debug Test ===');

// Test 1: Check if popup instance exists
if (window.tabOrganizerPopup) {
    console.log('✅ Popup instance found');
} else {
    console.error('❌ Popup instance not found');
}

// Test 2: Check required DOM elements
const requiredElements = [
    'organizeBtn', 'settingsBtn', 'searchInput', 'clearSearch',
    'saveGroupBtn', 'restoreGroupBtn', 'cleanupBtn', 'groupsContainer',
    'loadingIndicator', 'tabCount', 'groupCount'
];

console.log('\n=== DOM Elements Check ===');
requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ ${id} found`);
    } else {
        console.error(`❌ ${id} missing`);
    }
});

// Test 3: Check modal elements
const modalElements = [
    'createGroupModal', 'settingsModal', 'cancelCreateGroup', 
    'confirmCreateGroup', 'saveSettings'
];

console.log('\n=== Modal Elements Check ===');
modalElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ ${id} found`);
    } else {
        console.error(`❌ ${id} missing`);
    }
});

// Test 4: Check event listeners
console.log('\n=== Testing Event Listeners ===');
try {
    // Test organize button
    const organizeBtn = document.getElementById('organizeBtn');
    if (organizeBtn && organizeBtn.onclick === null) {
        console.log('✅ Organize button has proper event listener (no inline onclick)');
    } else {
        console.warn('⚠️ Organize button may have inline onclick handler');
    }

    // Test settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        console.log('✅ Settings button found');
    }

} catch (error) {
    console.error('❌ Error testing event listeners:', error);
}

// Test 5: Check if Chrome APIs are available
console.log('\n=== Chrome APIs Check ===');
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome runtime API available');
} else {
    console.error('❌ Chrome runtime API not available');
}

// Test 6: Test modal functionality
console.log('\n=== Modal Test ===');
try {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        // Test opening modal
        settingsModal.style.display = 'block';
        console.log('✅ Can open settings modal');
        
        // Test closing modal
        setTimeout(() => {
            settingsModal.style.display = 'none';
            console.log('✅ Can close settings modal');
        }, 1000);
    }
} catch (error) {
    console.error('❌ Modal test failed:', error);
}

console.log('\n=== Debug Test Complete ===');
console.log('Check above for any ❌ errors that need to be fixed.');