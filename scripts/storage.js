// Tab Organizer AI - Storage Management Utilities
class StorageManager {
    constructor() {
        this.storageKeys = {
            TAB_GROUPS: 'tabGroups',
            USER_CATEGORIES: 'userCategories',
            SAVED_SESSIONS: 'savedSessions',
            SETTINGS: 'settings',
            USAGE_STATS: 'usageStats'
        };
        
        this.defaultSettings = {
            autoOrganizeEnabled: true,
            unusedTabThreshold: 7,
            maxGroupsPerCategory: 5,
            enableNotifications: true,
            syncEnabled: false,
            theme: 'light'
        };
    }

    // Generic storage operations
    async set(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    async get(key, defaultValue = null) {
        try {
            const result = await chrome.storage.local.get([key]);
            return result[key] !== undefined ? result[key] : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    async remove(key) {
        try {
            await chrome.storage.local.remove([key]);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    async clear() {
        try {
            await chrome.storage.local.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // Tab Groups Management
    async saveTabGroups(tabGroups) {
        return await this.set(this.storageKeys.TAB_GROUPS, tabGroups);
    }

    async getTabGroups() {
        return await this.get(this.storageKeys.TAB_GROUPS, {});
    }

    async addTabToGroup(groupName, tab) {
        const tabGroups = await this.getTabGroups();
        if (!tabGroups[groupName]) {
            tabGroups[groupName] = [];
        }
        
        // Check if tab already exists in group
        const existingIndex = tabGroups[groupName].findIndex(t => t.id === tab.id);
        if (existingIndex === -1) {
            tabGroups[groupName].push(tab);
            await this.saveTabGroups(tabGroups);
        }
        
        return tabGroups;
    }

    async removeTabFromGroup(groupName, tabId) {
        const tabGroups = await this.getTabGroups();
        if (tabGroups[groupName]) {
            tabGroups[groupName] = tabGroups[groupName].filter(tab => tab.id !== tabId);
            
            // Remove empty groups
            if (tabGroups[groupName].length === 0) {
                delete tabGroups[groupName];
            }
            
            await this.saveTabGroups(tabGroups);
        }
        
        return tabGroups;
    }

    // Session Management
    async saveSession(sessionName, overwrite = false) {
        const tabGroups = await this.getTabGroups();
        const savedSessions = await this.get(this.storageKeys.SAVED_SESSIONS, {});
        
        if (savedSessions[sessionName] && !overwrite) {
            throw new Error('Session already exists');
        }
        
        savedSessions[sessionName] = {
            tabGroups: tabGroups,
            timestamp: Date.now(),
            tabCount: Object.values(tabGroups).reduce((sum, tabs) => sum + tabs.length, 0),
            groupCount: Object.keys(tabGroups).length
        };
        
        await this.set(this.storageKeys.SAVED_SESSIONS, savedSessions);
        return savedSessions[sessionName];
    }

    async getSavedSessions() {
        return await this.get(this.storageKeys.SAVED_SESSIONS, {});
    }

    async restoreSession(sessionName) {
        const savedSessions = await this.getSavedSessions();
        if (!savedSessions[sessionName]) {
            throw new Error('Session not found');
        }
        
        const session = savedSessions[sessionName];
        await this.saveTabGroups(session.tabGroups);
        
        return session;
    }

    async deleteSession(sessionName) {
        const savedSessions = await this.getSavedSessions();
        if (savedSessions[sessionName]) {
            delete savedSessions[sessionName];
            await this.set(this.storageKeys.SAVED_SESSIONS, savedSessions);
        }
        
        return savedSessions;
    }

    // Settings Management
    async getSettings() {
        const settings = await this.get(this.storageKeys.SETTINGS, {});
        return { ...this.defaultSettings, ...settings };
    }

    async updateSettings(newSettings) {
        const currentSettings = await this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return await this.set(this.storageKeys.SETTINGS, updatedSettings);
    }

    async resetSettings() {
        return await this.set(this.storageKeys.SETTINGS, this.defaultSettings);
    }

    // User Categories Management
    async getUserCategories() {
        return await this.get(this.storageKeys.USER_CATEGORIES, {});
    }

    async saveUserCategories(categories) {
        return await this.set(this.storageKeys.USER_CATEGORIES, categories);
    }

    async addUserCategory(name, config) {
        const categories = await this.getUserCategories();
        categories[name] = {
            color: config.color || 'grey',
            keywords: config.keywords || [],
            rules: config.rules || [],
            created: Date.now(),
            ...config
        };
        
        await this.saveUserCategories(categories);
        return categories;
    }

    async removeUserCategory(name) {
        const categories = await this.getUserCategories();
        if (categories[name]) {
            delete categories[name];
            await this.saveUserCategories(categories);
        }
        
        return categories;
    }

    // Usage Statistics
    async updateUsageStats(action, data = {}) {
        const stats = await this.get(this.storageKeys.USAGE_STATS, {
            totalTabsOrganized: 0,
            totalGroupsCreated: 0,
            totalTabsClosed: 0,
            lastUsed: null,
            dailyUsage: {},
            actionHistory: []
        });
        
        const today = new Date().toISOString().split('T')[0];
        
        // Update daily usage
        if (!stats.dailyUsage[today]) {
            stats.dailyUsage[today] = {
                tabsOrganized: 0,
                groupsCreated: 0,
                tabsClosed: 0,
                actions: 0
            };
        }
        
        // Update counters based on action
        switch (action) {
            case 'organizeTab':
                stats.totalTabsOrganized++;
                stats.dailyUsage[today].tabsOrganized++;
                break;
            case 'createGroup':
                stats.totalGroupsCreated++;
                stats.dailyUsage[today].groupsCreated++;
                break;
            case 'closeTab':
                stats.totalTabsClosed++;
                stats.dailyUsage[today].tabsClosed++;
                break;
        }
        
        stats.dailyUsage[today].actions++;
        stats.lastUsed = Date.now();
        
        // Add to action history (keep last 100 actions)
        stats.actionHistory.unshift({
            action,
            timestamp: Date.now(),
            data
        });
        
        if (stats.actionHistory.length > 100) {
            stats.actionHistory = stats.actionHistory.slice(0, 100);
        }
        
        // Clean up old daily usage (keep last 30 days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        const cutoffString = cutoffDate.toISOString().split('T')[0];
        
        Object.keys(stats.dailyUsage).forEach(date => {
            if (date < cutoffString) {
                delete stats.dailyUsage[date];
            }
        });
        
        await this.set(this.storageKeys.USAGE_STATS, stats);
        return stats;
    }

    async getUsageStats() {
        return await this.get(this.storageKeys.USAGE_STATS, {
            totalTabsOrganized: 0,
            totalGroupsCreated: 0,
            totalTabsClosed: 0,
            lastUsed: null,
            dailyUsage: {},
            actionHistory: []
        });
    }

    // Import/Export functionality
    async exportData() {
        const data = {
            tabGroups: await this.getTabGroups(),
            savedSessions: await this.getSavedSessions(),
            userCategories: await this.getUserCategories(),
            settings: await this.getSettings(),
            usageStats: await this.getUsageStats(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        return JSON.stringify(data, null, 2);
    }

    async importData(jsonData, options = { overwrite: false }) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.version || !data.exportDate) {
                throw new Error('Invalid export data format');
            }
            
            const currentData = {
                tabGroups: await this.getTabGroups(),
                savedSessions: await this.getSavedSessions(),
                userCategories: await this.getUserCategories(),
                settings: await this.getSettings()
            };
            
            // Merge or overwrite data
            const importPromises = [];
            
            if (data.tabGroups) {
                const tabGroups = options.overwrite ? data.tabGroups : { ...currentData.tabGroups, ...data.tabGroups };
                importPromises.push(this.saveTabGroups(tabGroups));
            }
            
            if (data.savedSessions) {
                const sessions = options.overwrite ? data.savedSessions : { ...currentData.savedSessions, ...data.savedSessions };
                importPromises.push(this.set(this.storageKeys.SAVED_SESSIONS, sessions));
            }
            
            if (data.userCategories) {
                const categories = options.overwrite ? data.userCategories : { ...currentData.userCategories, ...data.userCategories };
                importPromises.push(this.saveUserCategories(categories));
            }
            
            if (data.settings) {
                const settings = options.overwrite ? data.settings : { ...currentData.settings, ...data.settings };
                importPromises.push(this.updateSettings(settings));
            }
            
            await Promise.all(importPromises);
            return true;
            
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        }
    }

    // Storage quota management
    async getStorageInfo() {
        try {
            const usage = await chrome.storage.local.getBytesInUse();
            const quota = chrome.storage.local.QUOTA_BYTES;
            
            return {
                used: usage,
                available: quota - usage,
                total: quota,
                percentUsed: (usage / quota) * 100
            };
        } catch (error) {
            console.error('Storage info error:', error);
            return null;
        }
    }

    async cleanupOldData() {
        try {
            // Remove old daily usage data (older than 90 days)
            const stats = await this.getUsageStats();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);
            const cutoffString = cutoffDate.toISOString().split('T')[0];
            
            let cleaned = false;
            Object.keys(stats.dailyUsage).forEach(date => {
                if (date < cutoffString) {
                    delete stats.dailyUsage[date];
                    cleaned = true;
                }
            });
            
            if (cleaned) {
                await this.set(this.storageKeys.USAGE_STATS, stats);
            }
            
            return cleaned;
        } catch (error) {
            console.error('Cleanup error:', error);
            return false;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}