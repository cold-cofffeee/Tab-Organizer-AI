// Tab Organizer AI - Configuration Service
class ConfigService {
    constructor() {
        // Firebase configuration
        this.firebaseConfig = {
            apiKey: "AIzaSyDh1RQ654EVzbW3-z6NV8Nz12fgdvcxbw4",
            authDomain: "extensions-90528.firebaseapp.com",
            projectId: "extensions-90528",
            storageBucket: "extensions-90528.firebasestorage.app",
            messagingSenderId: "749971026370",
            appId: "1:749971026370:web:3afc2eceb908729f3ea65b",
            databaseURL: "https://extensions-90528-default-rtdb.firebaseio.com"
        };
    }

    // Get Firebase configuration
    getFirebaseConfig() {
        return this.firebaseConfig;
    }

    // A simple validation check
    isValid() {
        const config = this.firebaseConfig;
        return !!(config.apiKey && config.authDomain && config.projectId);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigService;
}