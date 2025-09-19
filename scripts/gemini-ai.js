// Tab Organizer AI - Gemini AI Integration Service
class GeminiAIService {
    constructor() {
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
        this.apiKey = null;
        this.rateLimitTracker = {
            requests: 0,
            resetTime: Date.now() + 60000 // 1 minute window
        };
        this.maxRequestsPerMinute = 50; // Conservative limit
        this.cache = new Map(); // Legacy cache for backward compatibility
        this.maxCacheSize = 500;
        
        // Initialize enhanced data service
        this.dataService = null;
        setTimeout(() => this.initDataService(), 100); // Delay to ensure all scripts loaded
        
        this.categories = {
            'social': {
                color: 'red',
                description: 'Social media platforms and networking sites'
            },
            'ai-tools': {
                color: 'purple',
                description: 'AI assistants, machine learning tools, and AI platforms'
            },
            'development': {
                color: 'blue',
                description: 'Programming, coding, development tools, and technical documentation'
            },
            'work-productivity': {
                color: 'green',
                description: 'Office applications, project management, business tools'
            },
            'entertainment': {
                color: 'orange',
                description: 'Video streaming, gaming, music, and entertainment content'
            },
            'shopping': {
                color: 'cyan',
                description: 'E-commerce, online stores, product browsing'
            },
            'news-information': {
                color: 'grey',
                description: 'News sites, blogs, informational content'
            },
            'education-research': {
                color: 'pink',
                description: 'Educational content, research papers, learning platforms'
            },
            'finance': {
                color: 'yellow',
                description: 'Banking, investment, cryptocurrency, financial services'
            },
            'health-wellness': {
                color: 'green',
                description: 'Health information, fitness, medical resources'
            },
            'general': {
                color: 'grey',
                description: 'Uncategorized or general purpose content'
            }
        };
    }

    async initialize() {
        await this.initDataService();
        await this.loadApiKey();
        await this.loadCache();
    }

    async initDataService() {
        try {
            console.log('🔧 Initializing data service...');
            console.log('SupabaseDataService available:', typeof SupabaseDataService !== 'undefined');
            
            // Load the Supabase service
            if (typeof SupabaseDataService !== 'undefined') {
                this.dataService = new SupabaseDataService();
                console.log('✅ Enhanced data service initialized');
                
                // Wait a moment for async initialization
                setTimeout(() => {
                    if (this.dataService) {
                        console.log('🔧 Data service status:', {
                            configured: this.dataService.isConfigured,
                            hasUrl: !!this.dataService.supabaseUrl,
                            hasKey: !!this.dataService.supabaseKey
                        });
                    }
                }, 1000);
            } else {
                console.warn('⚠️ SupabaseDataService not available, using legacy cache only');
            }
        } catch (error) {
            console.error('❌ Failed to initialize data service:', error);
        }
    }

    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['geminiApiKey']);
            if (result.geminiApiKey) {
                this.apiKey = await this.decryptApiKey(result.geminiApiKey);
            }
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }

    async saveApiKey(apiKey) {
        try {
            const encryptedKey = await this.encryptApiKey(apiKey);
            await chrome.storage.local.set({ geminiApiKey: encryptedKey });
            this.apiKey = apiKey;
            return true;
        } catch (error) {
            console.error('Error saving API key:', error);
            return false;
        }
    }

    async clearApiKey() {
        try {
            await chrome.storage.local.remove(['geminiApiKey']);
            this.apiKey = null;
            return true;
        } catch (error) {
            console.error('Error clearing API key:', error);
            return false;
        }
    }

    // Simple encryption for API key (browser-based)
    async encryptApiKey(apiKey) {
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        
        // Generate a key from a fixed string + random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode('tab-organizer-ai-encryption-key'),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        // Combine salt, iv, and encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        return btoa(String.fromCharCode(...combined));
    }

    async decryptApiKey(encryptedData) {
        try {
            const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const encrypted = combined.slice(28);
            
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode('tab-organizer-ai-encryption-key'),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            
            const key = await crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );
            
            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('Error decrypting API key:', error);
            return null;
        }
    }

    isRateLimited() {
        const now = Date.now();
        
        // Reset counter if window has passed
        if (now > this.rateLimitTracker.resetTime) {
            this.rateLimitTracker.requests = 0;
            this.rateLimitTracker.resetTime = now + 60000; // Next minute
        }
        
        return this.rateLimitTracker.requests >= this.maxRequestsPerMinute;
    }

    incrementRateLimit() {
        this.rateLimitTracker.requests++;
    }

    generateCacheKey(url, title, content) {
        // Create a hash for caching (simple hash function)
        const input = `${url}|${title}|${content.substring(0, 500)}`;
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    async loadCache() {
        try {
            const result = await chrome.storage.local.get(['aiCategorizeCache']);
            if (result.aiCategorizeCache) {
                // Convert back to Map
                const cacheArray = result.aiCategorizeCache;
                this.cache = new Map(cacheArray);
            }
        } catch (error) {
            console.error('Error loading cache:', error);
        }
    }

    async saveCache() {
        try {
            // Convert Map to array for storage
            const cacheArray = Array.from(this.cache.entries());
            await chrome.storage.local.set({ aiCategorizeCache: cacheArray });
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    async categorizeTab(tabData) {
        if (!this.apiKey) {
            console.log('No API key available, using fallback categorization');
            return this.fallbackCategorization(tabData);
        }

        // Check enhanced cache first (if available)
        if (this.dataService) {
            try {
                const cachedResult = await this.dataService.getCachedCategorization(tabData);
                if (cachedResult) {
                    console.log('Using enhanced cache result for:', tabData.url);
                    return cachedResult.category;
                }
            } catch (error) {
                console.warn('Enhanced cache lookup failed:', error);
            }
        }

        // Fallback to legacy cache
        const cacheKey = this.generateCacheKey(tabData.url, tabData.title, tabData.content || '');
        if (this.cache.has(cacheKey)) {
            console.log('Using legacy cached categorization result');
            const result = this.cache.get(cacheKey);
            
            // Migrate to enhanced cache if available
            if (this.dataService) {
                try {
                    await this.dataService.storeCategorization(tabData, result);
                } catch (error) {
                    console.warn('Failed to migrate to enhanced cache:', error);
                }
            }
            
            return result;
        }

        // Check rate limiting
        if (this.isRateLimited()) {
            console.log('Rate limited, using fallback categorization');
            return this.fallbackCategorization(tabData);
        }

        try {
            const category = await this.callGeminiAPI(tabData);
            
            // Store in enhanced cache (if available)
            if (this.dataService) {
                try {
                    console.log('📝 Storing new categorization in enhanced cache:', {
                        url: tabData.url,
                        category: category,
                        hasDataService: !!this.dataService,
                        serviceConfigured: this.dataService.isConfigured
                    });
                    await this.dataService.storeCategorization(tabData, category);
                    console.log('Stored categorization in enhanced cache');
                } catch (error) {
                    console.warn('Failed to store in enhanced cache:', error);
                }
            }
            
            // Also store in legacy cache for backward compatibility
            this.cache.set(cacheKey, category);
            
            // Manage cache size
            if (this.cache.size > this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            // Save cache periodically
            if (this.cache.size % 10 === 0) {
                await this.saveCache();
            }
            
            this.incrementRateLimit();
            return category;
            
        } catch (error) {
            console.error('Gemini API error:', error);
            return this.fallbackCategorization(tabData);
        }
    }

    async callGeminiAPI(tabData) {
        const prompt = this.buildPrompt(tabData);
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.1,
                maxOutputTokens: 50
            }
        };

        const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response format');
        }

        const responseText = data.candidates[0].content.parts[0].text.trim().toLowerCase();
        
        // Validate and return category
        return this.validateCategory(responseText);
    }

    buildPrompt(tabData) {
        const availableCategories = Object.keys(this.categories).join(', ');
        
        return `Analyze this website and categorize it into ONE of these categories: ${availableCategories}

Website Information:
- URL: ${tabData.url}
- Title: ${tabData.title}
- Content Preview: ${(tabData.content || '').substring(0, 800)}

Category Definitions:
- social: Social media platforms (Facebook, Instagram, Twitter, LinkedIn, TikTok, Reddit, etc.)
- ai-tools: AI assistants and tools (ChatGPT, Claude, Gemini, Copilot, AI image generators, etc.)
- development: Programming, coding, GitHub, Stack Overflow, documentation, dev tools
- work-productivity: Office apps, project management, business tools, email, calendars
- entertainment: YouTube, Netflix, streaming, gaming, music platforms, movies
- shopping: E-commerce, online stores, product pages, marketplaces
- news-information: News websites, blogs, Wikipedia, informational articles
- education-research: Learning platforms, courses, academic content, tutorials
- finance: Banking, trading, cryptocurrency, investment platforms
- health-wellness: Health information, fitness, medical resources, wellness
- general: Anything that doesn't clearly fit other categories

Instructions:
1. Consider the URL domain, page title, and content
2. Be specific about well-known platforms (e.g., youtube.com = entertainment, github.com = development)
3. Respond with ONLY the category name (e.g., "social", "ai-tools", "development")
4. If uncertain, use "general"

Category:`;
    }

    validateCategory(responseText) {
        // Extract just the category name from the response
        const category = responseText.replace(/[^a-z-]/g, '');
        
        // Check if it's a valid category
        if (this.categories.hasOwnProperty(category)) {
            return category;
        }
        
        // Try to match partial responses
        for (const validCategory of Object.keys(this.categories)) {
            if (category.includes(validCategory) || validCategory.includes(category)) {
                return validCategory;
            }
        }
        
        // Default fallback
        return 'general';
    }

    fallbackCategorization(tabData) {
        const url = tabData.url.toLowerCase();
        const title = tabData.title.toLowerCase();
        
        // Domain-based categorization for popular sites
        const domainCategories = {
            // Social Media
            'facebook.com': 'social',
            'instagram.com': 'social',
            'twitter.com': 'social',
            'x.com': 'social',
            'linkedin.com': 'social',
            'tiktok.com': 'social',
            'snapchat.com': 'social',
            'reddit.com': 'social',
            'pinterest.com': 'social',
            'discord.com': 'social',
            'telegram.org': 'social',
            'whatsapp.com': 'social',
            
            // AI Tools
            'openai.com': 'ai-tools',
            'chat.openai.com': 'ai-tools',
            'claude.ai': 'ai-tools',
            'anthropic.com': 'ai-tools',
            'bard.google.com': 'ai-tools',
            'gemini.google.com': 'ai-tools',
            'copilot.microsoft.com': 'ai-tools',
            'midjourney.com': 'ai-tools',
            'stable-diffusion': 'ai-tools',
            'huggingface.co': 'ai-tools',
            
            // Development
            'github.com': 'development',
            'gitlab.com': 'development',
            'stackoverflow.com': 'development',
            'codepen.io': 'development',
            'replit.com': 'development',
            'codesandbox.io': 'development',
            'npmjs.com': 'development',
            'pypi.org': 'development',
            'developer.mozilla.org': 'development',
            
            // Entertainment
            'youtube.com': 'entertainment',
            'netflix.com': 'entertainment',
            'spotify.com': 'entertainment',
            'twitch.tv': 'entertainment',
            'hulu.com': 'entertainment',
            'disney.com': 'entertainment',
            'primevideo.com': 'entertainment',
            'steam.com': 'entertainment',
            
            // Shopping
            'amazon.com': 'shopping',
            'ebay.com': 'shopping',
            'etsy.com': 'shopping',
            'shopify.com': 'shopping',
            'walmart.com': 'shopping',
            'target.com': 'shopping',
            'alibaba.com': 'shopping',
            
            // Work/Productivity
            'gmail.com': 'work-productivity',
            'outlook.com': 'work-productivity',
            'slack.com': 'work-productivity',
            'teams.microsoft.com': 'work-productivity',
            'zoom.us': 'work-productivity',
            'notion.so': 'work-productivity',
            'trello.com': 'work-productivity',
            'asana.com': 'work-productivity',
            
            // Finance
            'coinbase.com': 'finance',
            'binance.com': 'finance',
            'robinhood.com': 'finance',
            'paypal.com': 'finance',
            'stripe.com': 'finance',
            
            // News
            'cnn.com': 'news-information',
            'bbc.com': 'news-information',
            'reuters.com': 'news-information',
            'nytimes.com': 'news-information',
            'theguardian.com': 'news-information',
            'wikipedia.org': 'news-information'
        };
        
        // Check exact domain matches
        for (const [domain, category] of Object.entries(domainCategories)) {
            if (url.includes(domain)) {
                return category;
            }
        }
        
        // Keyword-based fallback
        const keywordCategories = {
            'social': ['social', 'chat', 'message', 'friend', 'follow', 'like', 'share'],
            'shopping': ['shop', 'buy', 'cart', 'price', 'product', 'store', 'order'],
            'entertainment': ['video', 'music', 'game', 'movie', 'stream', 'watch'],
            'development': ['code', 'programming', 'developer', 'api', 'documentation'],
            'work-productivity': ['email', 'meeting', 'calendar', 'document', 'office'],
            'finance': ['bank', 'crypto', 'trading', 'investment', 'money'],
            'news-information': ['news', 'article', 'blog', 'information', 'wiki'],
            'education-research': ['learn', 'course', 'tutorial', 'education', 'study']
        };
        
        const text = `${url} ${title}`.toLowerCase();
        
        for (const [category, keywords] of Object.entries(keywordCategories)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    async testApiKey(apiKey) {
        try {
            const testData = {
                url: 'https://github.com',
                title: 'GitHub',
                content: 'GitHub is a development platform'
            };
            
            const tempApiKey = this.apiKey;
            this.apiKey = apiKey;
            
            const result = await this.callGeminiAPI(testData);
            
            this.apiKey = tempApiKey;
            
            return { success: true, category: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getAvailableCategories() {
        return this.categories;
    }

    async getCacheStats() {
        const legacyStats = {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: this.cache.size > 0 ? 'Available' : 'Empty'
        };

        if (this.dataService) {
            try {
                const enhancedStats = await this.dataService.getCacheStats();
                return {
                    legacy: legacyStats,
                    enhanced: enhancedStats
                };
            } catch (error) {
                console.warn('Failed to get enhanced cache stats:', error);
            }
        }

        return { legacy: legacyStats };
    }

    async clearCache() {
        this.cache.clear();
        await chrome.storage.local.remove(['aiCategorizeCache']);
        
        // Also clear enhanced cache if available
        if (this.dataService) {
            try {
                await this.dataService.clearAllCaches();
                console.log('Enhanced cache cleared');
            } catch (error) {
                console.warn('Failed to clear enhanced cache:', error);
            }
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAIService;
} else if (typeof window !== 'undefined') {
    window.GeminiAIService = GeminiAIService;
}