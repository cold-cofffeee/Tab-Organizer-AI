// Tab Organizer AI - Configuration Service
class ConfigService {
    constructor() {
        this.apiKeyStorageKey = 'gemini_api_key';
        console.log('✅ Configuration service initialized');
    }

    /**
     * Get Gemini API configuration
     * @returns {Promise<Object>} - API configuration
     */
    async getGeminiConfig() {
        try {
            const result = await chrome.storage.local.get([this.apiKeyStorageKey]);
            return {
                apiKey: result[this.apiKeyStorageKey] || null
            };
        } catch (error) {
            console.error('❌ Failed to get Gemini config:', error);
            return { apiKey: null };
        }
    }

    /**
     * Set Gemini API key
     * @param {string} apiKey - The API key to store
     * @returns {Promise<boolean>} - Success status
     */
    async setGeminiApiKey(apiKey) {
        try {
            await chrome.storage.local.set({ [this.apiKeyStorageKey]: apiKey });
            console.log('✅ Gemini API key stored successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to store Gemini API key:', error);
            return false;
        }
    }

    /**
     * Check if API key is configured
     * @returns {Promise<boolean>} - True if API key exists
     */
    async isConfigured() {
        try {
            const config = await this.getGeminiConfig();
            return !!(config.apiKey && config.apiKey.trim().length > 0);
        } catch (error) {
            console.error('❌ Failed to check configuration:', error);
            return false;
        }
    }

    /**
     * Clear stored API key
     * @returns {Promise<boolean>} - Success status
     */
    async clearApiKey() {
        try {
            await chrome.storage.local.remove([this.apiKeyStorageKey]);
            console.log('✅ API key cleared successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear API key:', error);
            return false;
        }
    }
}

// Export service instance
const configService = new ConfigService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigService;
}