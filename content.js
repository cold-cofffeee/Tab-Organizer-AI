// Tab Organizer AI - Content Script
class ContentAnalyzer {
    constructor() {
        this.pageContent = null;
        this.metadata = null;
        this.init();
    }

    init() {
        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.analyzeContent());
        } else {
            this.analyzeContent();
        }

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getPageContent') {
                sendResponse(this.getPageAnalysis());
            }
        });
    }

    analyzeContent() {
        try {
            this.extractPageContent();
            this.extractMetadata();
            this.detectPageType();
        } catch (error) {
            console.error('Content analysis error:', error);
        }
    }

    extractPageContent() {
        // Get main content, avoiding navigation and ads
        const contentSelectors = [
            'main',
            'article',
            '[role="main"]',
            '.content',
            '.main-content',
            '#content',
            '#main'
        ];

        let mainContent = '';
        
        // Try to find main content area
        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                mainContent = element.innerText;
                break;
            }
        }

        // Fallback to body content with cleanup
        if (!mainContent) {
            mainContent = document.body.innerText;
            
            // Remove navigation, header, footer content
            const elementsToRemove = document.querySelectorAll([
                'nav', 'header', 'footer', 'aside',
                '.navigation', '.nav', '.menu',
                '.header', '.footer', '.sidebar',
                '.ads', '.advertisement', '.ad',
                '.cookie-notice', '.cookie-banner'
            ].join(','));

            elementsToRemove.forEach(el => {
                const text = el.innerText;
                if (text) {
                    mainContent = mainContent.replace(text, '');
                }
            });
        }

        // Clean and limit content
        this.pageContent = this.cleanText(mainContent).substring(0, 2000);
    }

    extractMetadata() {
        this.metadata = {
            title: document.title,
            description: this.getMetaContent('description'),
            keywords: this.getMetaContent('keywords'),
            author: this.getMetaContent('author'),
            ogTitle: this.getMetaContent('og:title'),
            ogDescription: this.getMetaContent('og:description'),
            ogType: this.getMetaContent('og:type'),
            twitterCard: this.getMetaContent('twitter:card'),
            canonical: this.getCanonicalUrl(),
            language: document.documentElement.lang || 'en',
            headings: this.extractHeadings(),
            links: this.extractLinks()
        };
    }

    getMetaContent(name) {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
    }

    getCanonicalUrl() {
        const canonical = document.querySelector('link[rel="canonical"]');
        return canonical ? canonical.href : window.location.href;
    }

    extractHeadings() {
        const headings = [];
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headingElements.forEach(heading => {
            const text = heading.innerText.trim();
            if (text && text.length < 200) {
                headings.push({
                    level: parseInt(heading.tagName.substring(1)),
                    text: text
                });
            }
        });

        return headings.slice(0, 10); // Limit to first 10 headings
    }

    extractLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');
        
        linkElements.forEach(link => {
            const href = link.href;
            const text = link.innerText.trim();
            
            if (href && text && text.length < 100 && !href.startsWith('javascript:')) {
                links.push({
                    url: href,
                    text: text
                });
            }
        });

        return links.slice(0, 20); // Limit to first 20 links
    }

    detectPageType() {
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const content = this.pageContent.toLowerCase();

        // E-commerce detection
        if (this.isEcommercePage(url, title, content)) {
            this.metadata.pageType = 'shopping';
            return;
        }

        // Social media detection
        if (this.isSocialMediaPage(url, title)) {
            this.metadata.pageType = 'social';
            return;
        }

        // Video/Entertainment detection
        if (this.isVideoPage(url, title, content)) {
            this.metadata.pageType = 'entertainment';
            return;
        }

        // News detection
        if (this.isNewsPage(url, title, content)) {
            this.metadata.pageType = 'news';
            return;
        }

        // Documentation/Learning detection
        if (this.isDocumentationPage(url, title, content)) {
            this.metadata.pageType = 'research';
            return;
        }

        // Work/Business detection
        if (this.isWorkPage(url, title, content)) {
            this.metadata.pageType = 'work';
            return;
        }

        this.metadata.pageType = 'general';
    }

    isEcommercePage(url, title, content) {
        const ecommerceIndicators = [
            'shop', 'store', 'buy', 'cart', 'checkout', 'price', 'product',
            'amazon', 'ebay', 'etsy', 'shopify', 'walmart', 'target'
        ];
        
        const ecommerceElements = document.querySelectorAll([
            '.price', '.cart', '.buy-now', '.add-to-cart',
            '.product-price', '.checkout', '.shopping-cart'
        ].join(','));

        return ecommerceIndicators.some(indicator => 
            url.includes(indicator) || title.includes(indicator) || content.includes(indicator)
        ) || ecommerceElements.length > 0;
    }

    isSocialMediaPage(url, title) {
        const socialSites = [
            'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
            'youtube.com', 'tiktok.com', 'snapchat.com', 'reddit.com',
            'pinterest.com', 'tumblr.com'
        ];

        return socialSites.some(site => url.includes(site));
    }

    isVideoPage(url, title, content) {
        const videoIndicators = [
            'video', 'watch', 'stream', 'netflix', 'hulu', 'prime video',
            'youtube', 'vimeo', 'twitch', 'movie', 'series', 'episode'
        ];

        const hasVideoElement = document.querySelector('video') !== null;

        return hasVideoElement || videoIndicators.some(indicator => 
            url.includes(indicator) || title.includes(indicator)
        );
    }

    isNewsPage(url, title, content) {
        const newsIndicators = [
            'news', 'article', 'breaking', 'reporter', 'journalist',
            'cnn.com', 'bbc.com', 'reuters.com', 'ap.org', 'nytimes.com',
            'washingtonpost.com', 'theguardian.com'
        ];

        const newsElements = document.querySelectorAll([
            '.article', '.news-article', '.story', '.byline',
            'time[datetime]', '.publish-date', '.author'
        ].join(','));

        return newsIndicators.some(indicator => 
            url.includes(indicator) || title.includes(indicator)
        ) || newsElements.length > 2;
    }

    isDocumentationPage(url, title, content) {
        const docIndicators = [
            'docs', 'documentation', 'api', 'tutorial', 'guide', 'manual',
            'readme', 'wiki', 'help', 'support', 'learn', 'course',
            'github.com', 'stackoverflow.com', 'developer.mozilla.org'
        ];

        const codeElements = document.querySelectorAll('pre, code, .highlight, .code-block');

        return docIndicators.some(indicator => 
            url.includes(indicator) || title.includes(indicator)
        ) || codeElements.length > 3;
    }

    isWorkPage(url, title, content) {
        const workIndicators = [
            'work', 'office', 'business', 'corporate', 'company',
            'meeting', 'calendar', 'schedule', 'task', 'project',
            'gmail.com', 'outlook.com', 'slack.com', 'teams.microsoft.com',
            'zoom.us', 'jira', 'confluence', 'salesforce.com'
        ];

        return workIndicators.some(indicator => 
            url.includes(indicator) || title.includes(indicator)
        );
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, ' ')
            .trim();
    }

    getPageAnalysis() {
        return {
            content: this.pageContent,
            metadata: this.metadata,
            url: window.location.href,
            timestamp: Date.now()
        };
    }

    // Advanced content analysis for AI categorization
    extractKeyPhrases() {
        if (!this.pageContent) return [];

        const words = this.pageContent.toLowerCase().split(/\s+/);
        const phrases = [];

        // Extract 2-3 word phrases
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i].length > 3 && words[i + 1].length > 3) {
                phrases.push(`${words[i]} ${words[i + 1]}`);
                
                if (i < words.length - 2 && words[i + 2].length > 3) {
                    phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
                }
            }
        }

        // Count phrase frequency
        const phraseCount = {};
        phrases.forEach(phrase => {
            phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
        });

        // Return top phrases
        return Object.entries(phraseCount)
            .filter(([phrase, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([phrase]) => phrase);
    }

    getContentSignature() {
        // Create a content signature for similar page detection
        const features = {
            domain: window.location.hostname,
            pathPattern: window.location.pathname.replace(/\d+/g, 'N'),
            titleWords: document.title.toLowerCase().split(/\s+/).slice(0, 5),
            keyPhrases: this.extractKeyPhrases().slice(0, 5),
            pageType: this.metadata?.pageType || 'general'
        };

        return JSON.stringify(features);
    }
}

// Initialize content analyzer
const contentAnalyzer = new ContentAnalyzer();