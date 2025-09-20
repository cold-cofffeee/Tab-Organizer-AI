// Tab Organizer AI - Local Database Service
class LocalDataService {
    constructor() {
        this.storageKey = 'tab_organizer_cache';
        this.isConfigured = true; // Always available with Chrome extension storage
        console.log('✅ Local database service initialized');
    }

    /**
     * Store a tab categorization in local storage
     * @param {Object} data - Tab data with url and title
     * @param {string} category - AI-generated category
     * @returns {Promise<string>} - Storage key for the entry
     */
    async storeCategorization(data, category) {
        try {
            const urlHash = this.generateUrlHash(data.url);
            
            const categorizationData = {
                url: data.url,
                title: data.title,
                category: category,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            // Get existing cache
            const cache = await this.getCache();
            cache[urlHash] = categorizationData;

            // Store updated cache
            await chrome.storage.local.set({ [this.storageKey]: cache });
            
            console.log('✅ Categorization stored locally for URL:', data.url);
            return urlHash;

        } catch (error) {
            console.error('❌ Failed to store categorization locally:', error);
            return null;
        }
    }

    /**
     * Retrieve a categorization for a specific URL
     * @param {string} url - The URL to look up
     * @returns {Promise<Object|null>} - Cached categorization data or null
     */
    async getCategorization(url) {
        try {
            const urlHash = this.generateUrlHash(url);
            const cache = await this.getCache();
            
            const result = cache[urlHash] || null;
            if (result) {
                console.log('✅ Found cached categorization for:', url);
            }
            
            return result;

        } catch (error) {
            console.error('❌ Failed to retrieve categorization:', error);
            return null;
        }
    }

    /**
     * Get all cached categorizations
     * @returns {Promise<Object>} - All cached data
     */
    async getAllCategorizations() {
        try {
            const cache = await this.getCache();
            console.log(`✅ Retrieved ${Object.keys(cache).length} cached categorizations`);
            return cache;

        } catch (error) {
            console.error('❌ Failed to retrieve all categorizations:', error);
            return {};
        }
    }

    /**
     * Check if a URL is already cached
     * @param {string} url - URL to check
     * @returns {Promise<boolean>} - True if cached, false otherwise
     */
    async isCached(url) {
        try {
            const result = await this.getCategorization(url);
            return result !== null;

        } catch (error) {
            console.error('❌ Failed to check cache status:', error);
            return false;
        }
    }

    /**
     * Clear all cached data
     * @returns {Promise<boolean>} - Success status
     */
    async clearCache() {
        try {
            await chrome.storage.local.remove(this.storageKey);
            console.log('✅ Cache cleared successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to clear cache:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} - Cache stats
     */
    async getCacheStats() {
        try {
            const cache = await this.getCache();
            const entries = Object.values(cache);
            
            const stats = {
                totalEntries: entries.length,
                categories: [...new Set(entries.map(e => e.category))].sort(),
                oldestEntry: entries.reduce((oldest, entry) => 
                    !oldest || new Date(entry.createdAt) < new Date(oldest.createdAt) ? entry : oldest, null),
                newestEntry: entries.reduce((newest, entry) => 
                    !newest || new Date(entry.createdAt) > new Date(newest.createdAt) ? entry : newest, null),
                sizeEstimate: JSON.stringify(cache).length + ' bytes'
            };

            return stats;

        } catch (error) {
            console.error('❌ Failed to get cache stats:', error);
            return { totalEntries: 0, categories: [], sizeEstimate: '0 bytes' };
        }
    }

    /**
     * Search cached categorizations
     * @param {string} searchTerm - Term to search for in URLs, titles, or categories
     * @returns {Promise<Array>} - Matching entries
     */
    async searchCache(searchTerm) {
        try {
            const cache = await this.getCache();
            const searchLower = searchTerm.toLowerCase();
            
            const matches = Object.values(cache).filter(entry =>
                entry.url.toLowerCase().includes(searchLower) ||
                entry.title.toLowerCase().includes(searchLower) ||
                entry.category.toLowerCase().includes(searchLower)
            );

            console.log(`✅ Found ${matches.length} matches for "${searchTerm}"`);
            return matches;

        } catch (error) {
            console.error('❌ Failed to search cache:', error);
            return [];
        }
    }

    // Private helper methods

    /**
     * Get the current cache from storage
     * @returns {Promise<Object>} - Current cache object
     */
    async getCache() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            return result[this.storageKey] || {};

        } catch (error) {
            console.error('❌ Failed to get cache from storage:', error);
            return {};
        }
    }

    /**
     * Generate a consistent hash for URLs
     * @param {string} url - URL to hash
     * @returns {string} - URL hash
     */
    generateUrlHash(url) {
        // Clean the URL and create a safe key
        const cleanUrl = url.toLowerCase().trim();
        return btoa(cleanUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
    }

    /**
     * Check if the service is properly configured
     * @returns {boolean} - Configuration status
     */
    isReady() {
        return this.isConfigured && typeof chrome !== 'undefined' && chrome.storage;
    }
}

// Export service instance
const localDataService = new LocalDataService();