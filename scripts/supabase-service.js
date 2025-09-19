// Tab Organizer AI - Supabase Data Management Service
class SupabaseDataService {
    constructor() {
        this.configService = new SecureConfigService();
        this.supabaseUrl = null;
        this.supabaseKey = null;
        this.isConfigured = false;
        this.localCache = new Map();
        this.maxLocalCacheSize = 1000;
        
        // URL pattern cache for intelligent domain-based caching
        this.domainPatternCache = new Map();
        this.maxDomainCacheSize = 200;
        
        this.init();
    }

    async init() {
        await this.loadConfiguration();
        await this.loadLocalCache();
        await this.loadDomainPatterns();
    }

    async loadConfiguration() {
        try {
            // Use secure hardcoded configuration
            if (this.configService.isValid()) {
                const config = this.configService.getConfig();
                this.supabaseUrl = config.url;
                this.supabaseKey = config.key;
                this.isConfigured = true;
                console.log('🔒 Secure data service ready');
            } else {
                console.log('⚠️ Configuration validation failed, using local cache only');
                this.isConfigured = false;
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.isConfigured = false;
        }
    }

    // Auto-configuration is now handled by encrypted config
    async testConnection() {
        if (!this.isConfigured) {
            return { success: false, error: 'Configuration not available' };
        }

        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
                method: 'HEAD',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                }
            });

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: `Connection failed: ${response.status}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Enhanced caching with URL pattern recognition
    generateCacheKey(url, title, content = '') {
        // Extract domain for pattern matching
        const domain = this.extractDomain(url);
        const contentHash = this.simpleHash(url + title + content);
        return `${domain}_${contentHash}`;
    }

    generateDomainKey(url) {
        const domain = this.extractDomain(url);
        const path = this.extractPathPattern(url);
        return `${domain}_${path}`;
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'unknown';
        }
    }

    extractPathPattern(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            // Create simplified path patterns
            if (path === '/' || path === '') return 'home';
            if (path.includes('/watch')) return 'video'; // YouTube
            if (path.includes('/post') || path.includes('/status')) return 'social'; // Social media
            if (path.includes('/docs') || path.includes('/documentation')) return 'docs';
            if (path.includes('/blog')) return 'blog';
            if (path.includes('/shop') || path.includes('/product')) return 'shopping';
            
            // Use first path segment for general categorization
            const segments = path.split('/').filter(Boolean);
            return segments[0] || 'general';
        } catch {
            return 'general';
        }
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Check if we have a cached result for similar URLs
    async getCachedCategorization(tabData) {
        const cacheKey = this.generateCacheKey(tabData.url, tabData.title, tabData.content);
        
        // Check local cache first
        if (this.localCache.has(cacheKey)) {
            console.log('Cache hit (local):', cacheKey);
            return this.localCache.get(cacheKey);
        }

        // Check domain pattern cache
        const domainKey = this.generateDomainKey(tabData.url);
        if (this.domainPatternCache.has(domainKey)) {
            const domainResult = this.domainPatternCache.get(domainKey);
            console.log('Cache hit (domain pattern):', domainKey, domainResult);
            
            // Store in local cache for faster future access
            this.localCache.set(cacheKey, domainResult);
            await this.saveLocalCache();
            
            return domainResult;
        }

        // Check Supabase if configured
        if (this.isConfigured) {
            try {
                const supabaseResult = await this.getFromSupabase(cacheKey);
                if (supabaseResult) {
                    // Cache locally for performance
                    this.localCache.set(cacheKey, supabaseResult);
                    await this.saveLocalCache();
                    return supabaseResult;
                }
            } catch (error) {
                console.warn('Supabase lookup failed, using local cache only:', error);
            }
        }

        return null;
    }

    // Store categorization result with intelligent caching
    async storeCategorization(tabData, category) {
        const cacheKey = this.generateCacheKey(tabData.url, tabData.title, tabData.content);
        const domainKey = this.generateDomainKey(tabData.url);
        
        const result = {
            category,
            timestamp: Date.now(),
            url: tabData.url,
            domain: this.extractDomain(tabData.url),
            confidence: 'high' // Could be enhanced with actual confidence scoring
        };

        // Store in local cache
        this.localCache.set(cacheKey, result);
        
        // Store domain pattern for similar URLs
        this.domainPatternCache.set(domainKey, result);
        
        // Manage cache size
        await this.manageLocalCacheSize();
        await this.manageDomainCacheSize();
        
        // Save to local storage
        await this.saveLocalCache();
        await this.saveDomainPatterns();
        
        // Store in Supabase if configured
        if (this.isConfigured) {
            try {
                await this.storeInSupabase(cacheKey, result);
            } catch (error) {
                console.warn('Failed to store in Supabase:', error);
            }
        }

        return result;
    }

    async getFromSupabase(key) {
        if (!this.isConfigured) return null;

        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/tab_categorizations?cache_key=eq.${key}`, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    return data[0].result;
                }
            }
        } catch (error) {
            console.error('Supabase read error:', error);
        }

        return null;
    }

    async storeInSupabase(key, result) {
        if (!this.isConfigured) return;

        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/tab_categorizations`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    cache_key: key,
                    result: result,
                    domain: result.domain,
                    category: result.category,
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Supabase write failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Supabase write error:', error);
            throw error;
        }
    }

    // Local cache management
    async loadLocalCache() {
        try {
            const result = await chrome.storage.local.get(['enhancedTabCache']);
            if (result.enhancedTabCache) {
                this.localCache = new Map(result.enhancedTabCache);
            }
        } catch (error) {
            console.error('Error loading local cache:', error);
        }
    }

    async saveLocalCache() {
        try {
            const cacheArray = Array.from(this.localCache.entries());
            await chrome.storage.local.set({ enhancedTabCache: cacheArray });
        } catch (error) {
            console.error('Error saving local cache:', error);
        }
    }

    async loadDomainPatterns() {
        try {
            const result = await chrome.storage.local.get(['domainPatternCache']);
            if (result.domainPatternCache) {
                this.domainPatternCache = new Map(result.domainPatternCache);
            }
        } catch (error) {
            console.error('Error loading domain patterns:', error);
        }
    }

    async saveDomainPatterns() {
        try {
            const cacheArray = Array.from(this.domainPatternCache.entries());
            await chrome.storage.local.set({ domainPatternCache: cacheArray });
        } catch (error) {
            console.error('Error saving domain patterns:', error);
        }
    }

    async manageLocalCacheSize() {
        if (this.localCache.size > this.maxLocalCacheSize) {
            // Remove oldest entries (simple FIFO)
            const entries = Array.from(this.localCache.entries());
            const toRemove = entries.slice(0, entries.length - this.maxLocalCacheSize + 50); // Remove extra 50
            
            toRemove.forEach(([key]) => {
                this.localCache.delete(key);
            });
        }
    }

    async manageDomainCacheSize() {
        if (this.domainPatternCache.size > this.maxDomainCacheSize) {
            const entries = Array.from(this.domainPatternCache.entries());
            const toRemove = entries.slice(0, entries.length - this.maxDomainCacheSize + 20);
            
            toRemove.forEach(([key]) => {
                this.domainPatternCache.delete(key);
            });
        }
    }

    // Analytics and management functions
    async getCacheStats() {
        const localSize = this.localCache.size;
        const domainSize = this.domainPatternCache.size;
        
        let supabaseStats = null;
        if (this.isConfigured) {
            try {
                const response = await fetch(`${this.supabaseUrl}/rest/v1/tab_categorizations?select=count`, {
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    supabaseStats = { totalRecords: data.length };
                }
            } catch (error) {
                console.warn('Could not get Supabase stats:', error);
            }
        }

        return {
            localCache: {
                size: localSize,
                maxSize: this.maxLocalCacheSize,
                usage: `${((localSize / this.maxLocalCacheSize) * 100).toFixed(1)}%`
            },
            domainCache: {
                size: domainSize,
                maxSize: this.maxDomainCacheSize,
                usage: `${((domainSize / this.maxDomainCacheSize) * 100).toFixed(1)}%`
            },
            supabase: supabaseStats || { status: 'Not configured' },
            isSupabaseConfigured: this.isConfigured
        };
    }

    async clearAllCaches() {
        this.localCache.clear();
        this.domainPatternCache.clear();
        
        await chrome.storage.local.remove(['enhancedTabCache', 'domainPatternCache']);
        
        if (this.isConfigured) {
            // Optionally clear Supabase data (be careful with this!)
            console.log('Local caches cleared. Supabase data preserved.');
        }
        
        return { success: true };
    }

    // Export data for backup/analysis
    async exportData() {
        const localData = Array.from(this.localCache.entries());
        const domainData = Array.from(this.domainPatternCache.entries());
        
        return {
            localCache: localData,
            domainPatterns: domainData,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseDataService;
}