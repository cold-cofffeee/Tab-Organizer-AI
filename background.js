// Import the services
importScripts('scripts/config.js');
importScripts('scripts/local-storage.js');
importScripts('scripts/gemini-ai.js');

// Tab Organizer AI - Background Service Worker
class TabOrganizerAI {
  constructor() {
    this.tabGroups = new Map();
    this.geminiAI = new GeminiAIService();
    this.dataService = new LocalDataService();
    this.tabCategories = {}; // Will be populated from Gemini AI service
    this.init();
  }

  async init() {
    // Initialize Gemini AI service
    await this.geminiAI.initialize();
    this.tabCategories = this.geminiAI.getAvailableCategories();
    
    // Load saved data
    await this.loadSavedGroups();
    
    // Set up event listeners
    chrome.tabs.onCreated.addListener((tab) => this.onTabCreated(tab));
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => this.onTabUpdated(tabId, changeInfo, tab));
    chrome.tabs.onRemoved.addListener((tabId) => this.onTabRemoved(tabId));
    chrome.tabs.onActivated.addListener((activeInfo) => this.onTabActivated(activeInfo));
    
    // Command listeners
    chrome.commands.onCommand.addListener((command) => this.handleCommand(command));
    
    // Initial organization
    setTimeout(() => this.organizeAllTabs(), 2000);
  }

  async loadSavedGroups() {
    try {
      const result = await chrome.storage.local.get(['tabGroups', 'userCategories']);
      if (result.tabGroups) {
        this.tabGroups = new Map(Object.entries(result.tabGroups));
      }
      if (result.userCategories) {
        this.tabCategories = { ...this.tabCategories, ...result.userCategories };
      }
    } catch (error) {
      console.error('Error loading saved groups:', error);
    }
  }

  async saveGroups() {
    try {
      await chrome.storage.local.set({
        tabGroups: Object.fromEntries(this.tabGroups),
        userCategories: this.tabCategories
      });
    } catch (error) {
      console.error('Error saving groups:', error);
    }
  }

  async onTabCreated(tab) {
    if (tab.url && !tab.url.startsWith('chrome://')) {
      setTimeout(() => this.analyzeAndGroupTab(tab), 1000);
    }
  }

  async onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
      this.analyzeAndGroupTab(tab);
    }
  }

  onTabRemoved(tabId) {
    // Clean up any references to the removed tab
    for (const [groupId, tabs] of this.tabGroups.entries()) {
      const index = tabs.findIndex(t => t.id === tabId);
      if (index !== -1) {
        tabs.splice(index, 1);
        if (tabs.length === 0) {
          this.tabGroups.delete(groupId);
        }
        this.saveGroups();
        break;
      }
    }
  }

  onTabActivated(activeInfo) {
    // Update last accessed time
    const tabId = activeInfo.tabId;
    for (const tabs of this.tabGroups.values()) {
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        tab.lastAccessed = Date.now();
        break;
      }
    }
  }

  async analyzeAndGroupTab(tab) {
    try {
      const category = await this.categorizeTab(tab);
      await this.groupTabByCategory(tab, category);
    } catch (error) {
      console.error('Error analyzing tab:', error);
    }
  }

  async categorizeTab(tab) {
    try {
      // Get enhanced content from content script
      let pageAnalysis = null;
      try {
        const results = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
        pageAnalysis = results;
      } catch (error) {
        // Content script not available, use basic data
        console.log('Content script not available for tab:', tab.id);
      }

      // Prepare data for AI analysis
      const tabData = {
        url: tab.url,
        title: tab.title,
        content: pageAnalysis?.content || '',
        metadata: pageAnalysis?.metadata || {},
        favIconUrl: tab.favIconUrl
      };

      // Use Gemini AI for categorization
      const category = await this.geminiAI.categorizeTab(tabData);
      
      console.log(`Tab "${tab.title}" categorized as: ${category}`);
      return category;
      
    } catch (error) {
      console.error('Error categorizing tab:', error);
      // Fallback to basic categorization
      return this.basicCategorizeTab(tab);
    }
  }

  // Fallback method for when AI is not available
  basicCategorizeTab(tab) {
    const url = tab.url.toLowerCase();
    const title = tab.title.toLowerCase();
    
    // Simple domain-based categorization
    if (url.includes('youtube.com') || url.includes('netflix.com') || url.includes('spotify.com')) {
      return 'entertainment';
    } else if (url.includes('github.com') || url.includes('stackoverflow.com')) {
      return 'development';
    } else if (url.includes('facebook.com') || url.includes('twitter.com') || url.includes('instagram.com')) {
      return 'social';
    } else if (url.includes('amazon.com') || url.includes('ebay.com')) {
      return 'shopping';
    } else if (url.includes('gmail.com') || url.includes('outlook.com') || url.includes('slack.com')) {
      return 'work-productivity';
    }
    
    return 'general';
  }

  async groupTabByCategory(tab, category) {
    try {
      const categoryData = this.tabCategories[category] || { color: 'grey' };
      
      // Find existing group for this category
      let groupId = null;
      const existingGroups = await chrome.tabGroups.query({});
      
      for (const group of existingGroups) {
        if (group.title === category) {
          groupId = group.id;
          break;
        }
      }

      // Create new group if needed
      if (!groupId) {
        const group = await chrome.tabs.group({ tabIds: [tab.id] });
        groupId = group;
        
        await chrome.tabGroups.update(groupId, {
          title: category,
          color: categoryData.color
        });
      } else {
        // Add tab to existing group
        await chrome.tabs.group({ tabIds: [tab.id], groupId: groupId });
      }

      // Update internal tracking
      if (!this.tabGroups.has(category)) {
        this.tabGroups.set(category, []);
      }
      
      const existingTabIndex = this.tabGroups.get(category).findIndex(t => t.id === tab.id);
      if (existingTabIndex === -1) {
        this.tabGroups.get(category).push({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          favicon: tab.favIconUrl,
          lastAccessed: Date.now()
        });
      }

      await this.saveGroups();
      
    } catch (error) {
      console.error('Error grouping tab:', error);
    }
  }

  async organizeAllTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://')) {
          await this.analyzeAndGroupTab(tab);
        }
      }
    } catch (error) {
      console.error('Error organizing all tabs:', error);
    }
  }

  async handleCommand(command) {
    switch (command) {
      case 'organize-tabs':
        await this.organizeAllTabs();
        break;
      case 'quick-group':
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
          await this.analyzeAndGroupTab(activeTab);
        }
        break;
      case 'search-tabs':
        // Open popup for search
        chrome.action.openPopup();
        break;
    }
  }

  async getTabGroups() {
    return Object.fromEntries(this.tabGroups);
  }

  async createCustomGroup(name, tabIds, color = 'grey') {
    try {
      const groupId = await chrome.tabs.group({ tabIds: tabIds });
      await chrome.tabGroups.update(groupId, {
        title: name,
        color: color
      });

      // Update internal tracking
      const tabs = await chrome.tabs.query({ groupId: groupId });
      this.tabGroups.set(name, tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        favicon: tab.favIconUrl,
        lastAccessed: Date.now()
      })));

      await this.saveGroups();
      return groupId;
    } catch (error) {
      console.error('Error creating custom group:', error);
      throw error;
    }
  }

  async getUnusedTabs(dayThreshold = 7) {
    const threshold = Date.now() - (dayThreshold * 24 * 60 * 60 * 1000);
    const unusedTabs = [];

    for (const tabs of this.tabGroups.values()) {
      for (const tab of tabs) {
        if (tab.lastAccessed < threshold) {
          unusedTabs.push(tab);
        }
      }
    }

    return unusedTabs;
  }
}

// Initialize the Tab Organizer AI
const tabOrganizerAI = new TabOrganizerAI();

// Message handling for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getTabGroups':
      tabOrganizerAI.getTabGroups().then(sendResponse);
      return true;
    
    case 'organizeAllTabs':
      tabOrganizerAI.organizeAllTabs().then(() => sendResponse({ success: true }));
      return true;
    
    case 'quickGroup':
      if (request.tabId) {
        chrome.tabs.get(request.tabId)
          .then(tab => tabOrganizerAI.analyzeAndGroupTab(tab))
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      } else {
        sendResponse({ success: false, error: 'No tab ID provided' });
      }
      return true;
    
    case 'createCustomGroup':
      tabOrganizerAI.createCustomGroup(request.name, request.tabIds, request.color)
        .then(groupId => sendResponse({ success: true, groupId }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'getUnusedTabs':
      tabOrganizerAI.getUnusedTabs(request.dayThreshold)
        .then(sendResponse);
      return true;

    case 'switchToTab':
      chrome.tabs.update(request.tabId, { active: true })
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'closeTab':
      chrome.tabs.remove(request.tabId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    // Gemini AI related actions
    case 'saveApiKey':
      tabOrganizerAI.geminiAI.saveApiKey(request.apiKey)
        .then(success => sendResponse({ success }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'testApiKey':
      tabOrganizerAI.geminiAI.testApiKey(request.apiKey)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'clearApiKey':
      tabOrganizerAI.geminiAI.clearApiKey()
        .then(success => sendResponse({ success }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getAiStats':
      tabOrganizerAI.geminiAI.getCacheStats()
        .then(stats => sendResponse(stats))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'clearAiCache':
      tabOrganizerAI.geminiAI.clearCache()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    // Data service actions
    case 'testDbConnection':
      tabOrganizerAI.dataService.testConnection()
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});