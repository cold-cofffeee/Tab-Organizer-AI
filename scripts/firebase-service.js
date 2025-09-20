// Tab Organizer AI - Firebase Data Service
class FirebaseDataService {
    constructor() {
        this.configService = new ConfigService();
        this.firebaseConfig = this.configService.getFirebaseConfig();
        this.db = null;
        this.isConfigured = false;

        this.init();
    }

    init() {
        if (this.configService.isValid()) {
            try {
                // Initialize Firebase
                if (!firebase.apps.length) {
                    firebase.initializeApp(this.firebaseConfig);
                }
                this.db = firebase.database();
                this.isConfigured = true;
                console.log('✅ Firebase Realtime Database initialized');
            } catch (error) {
                console.error('❌ Failed to initialize Firebase:', error);
                this.isConfigured = false;
            }
        } else {
            console.warn('⚠️ Firebase configuration is not valid. Data service will not be available.');
            this.isConfigured = false;
        }
    }

    async storeCategorization(data, category) {
        if (!this.isConfigured) {
            console.warn('Firebase not configured, skipping storeCategorization');
            return null;
        }

        try {
            // Generate a key based on the URL to avoid duplicates and allow for updates
            const urlHash = btoa(data.url).replace(/[^a-zA-Z0-9]/g, '');
            const dbRef = firebase.database().ref('tab_categorizations/' + urlHash);

            const categorizationData = {
                url: data.url,
                title: data.title,
                category: category,
                createdAt: new Date().toISOString()
            };

            await dbRef.set(categorizationData);
            console.log("Categorization data stored for URL:", data.url);
            return urlHash;
        } catch (error) {
            console.error("Error storing categorization data: ", error);
            return null;
        }
    }

    async getCachedCategorization(tabData) {
        if (!this.isConfigured) {
            console.warn('Firebase not configured, skipping getCachedCategorization');
            return null;
        }

        try {
            const urlHash = btoa(tabData.url).replace(/[^a-zA-Z0-9]/g, '');
            const dbRef = firebase.database().ref('tab_categorizations/' + urlHash);
            const snapshot = await dbRef.once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('Found cached categorization in Firebase for:', tabData.url);
                return data;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting cached categorization: ", error);
            return null;
        }
    }
    
    async getCacheStats() {
        if (!this.isConfigured) return { size: 0, hitRate: 'N/A' };
        
        try {
            const dbRef = firebase.database().ref('tab_categorizations');
            const snapshot = await dbRef.once('value');
            const numItems = snapshot.numChildren();
            return {
                size: numItems,
                hitRate: 'Available'
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return { size: 0, hitRate: 'Error' };
        }
    }
    
    async clearAllCaches() {
        if (!this.isConfigured) return;
        
        try {
            const dbRef = firebase.database().ref('tab_categorizations');
            await dbRef.remove();
            console.log('Firebase cache cleared.');
        } catch (error) {
            console.error('Error clearing Firebase cache:', error);
        }
    }

    async testConnection() {
        if (!this.isConfigured) {
            return { success: false, error: "Firebase not configured." };
        }
        try {
            // Try to read a non-existent location to test connection and auth without reading actual data.
            await firebase.database().ref('.info/connected').once('value');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}