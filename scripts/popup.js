// Tab Organizer AI - Popup Script
class TabOrganizerPopup {
    constructor() {
        this.tabGroups = {};
        this.selectedTabs = new Set();
        this.currentFilter = '';
        this.draggedElement = null;
        this.isProcessing = false; // Add processing flag to prevent button spam
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            console.log('Initializing Tab Organizer AI...');
            
            // Verify required DOM elements exist
            const requiredElements = [
                'organizeBtn', 'settingsBtn', 'searchInput', 'clearSearch',
                'saveGroupBtn', 'restoreGroupBtn', 'cleanupBtn', 'groupsContainer',
                'loadingIndicator', 'tabCount', 'groupCount'
            ];
            
            const missingElements = requiredElements.filter(id => !document.getElementById(id));
            if (missingElements.length > 0) {
                throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
            }
            
            this.setupEventListeners();
            await this.loadTabGroups();
            this.updateStats();
            this.hideLoading();
            
            // Make popup instance globally accessible for debugging
            window.tabOrganizerPopup = this;
            console.log('Tab Organizer AI initialized successfully');
            
        } catch (error) {
            console.error('Error initializing popup:', error);
            this.showError(`Failed to initialize Tab Organizer AI: ${error.message}`);
            this.hideLoading();
        }
    }

    setupEventListeners() {
        // Header actions with debouncing
        const organizeBtn = document.getElementById('organizeBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        
        if (organizeBtn) organizeBtn.addEventListener('click', (e) => this.debounce(() => this.organizeAllTabs(), e.target));
        if (settingsBtn) settingsBtn.addEventListener('click', (e) => this.debounce(() => this.openSettings(), e.target));

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        if (searchInput) searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        if (clearSearch) clearSearch.addEventListener('click', () => this.clearSearch());

        // Quick actions with debouncing
        const saveGroupBtn = document.getElementById('saveGroupBtn');
        const restoreGroupBtn = document.getElementById('restoreGroupBtn');
        const cleanupBtn = document.getElementById('cleanupBtn');
        
        if (saveGroupBtn) saveGroupBtn.addEventListener('click', (e) => this.debounce(() => this.saveCurrentGroups(), e.target));
        if (restoreGroupBtn) restoreGroupBtn.addEventListener('click', (e) => this.debounce(() => this.restoreGroups(), e.target));
        if (cleanupBtn) cleanupBtn.addEventListener('click', (e) => this.debounce(() => this.cleanupUnusedTabs(), e.target));

        // Modal controls
        this.setupModalListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupModalListeners() {
        console.log('Setting up modal listeners...');
        
        // Close modal buttons with safety checks
        const closeButtons = document.querySelectorAll('.modal-close');
        console.log(`Found ${closeButtons.length} modal close buttons`);
        
        closeButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                console.log(`Close button ${index} clicked`);
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Color picker with safety checks
        const colorOptions = document.querySelectorAll('.color-option');
        console.log(`Found ${colorOptions.length} color options`);
        
        colorOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                colorOptions.forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        // Create group modal actions
        const cancelBtn = document.getElementById('cancelCreateGroup');
        const confirmBtn = document.getElementById('confirmCreateGroup');
        const saveSettingsBtn = document.getElementById('saveSettings');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('createGroupModal');
                if (modal) modal.style.display = 'none';
            });
        } else {
            console.warn('cancelCreateGroup button not found');
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => this.debounce(() => this.createCustomGroup(), e.target));
        } else {
            console.warn('confirmCreateGroup button not found');
        }

        // Settings actions
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', (e) => this.debounce(() => this.saveSettings(), e.target));
        } else {
            console.warn('saveSettings button not found');
        }

        // API Key management with debouncing
        const toggleApiKey = document.getElementById('toggleApiKey');
        const testApiKey = document.getElementById('testApiKey');
        const saveApiKey = document.getElementById('saveApiKey');
        const clearApiKey = document.getElementById('clearApiKey');
        const clearAiCache = document.getElementById('clearAiCache');
        
        if (toggleApiKey) toggleApiKey.addEventListener('click', () => this.toggleApiKeyVisibility());
        if (testApiKey) testApiKey.addEventListener('click', (e) => this.debounce(() => this.testApiKey(), e.target));
        if (saveApiKey) saveApiKey.addEventListener('click', (e) => this.debounce(() => this.saveApiKey(), e.target));
        if (clearApiKey) clearApiKey.addEventListener('click', (e) => this.debounce(() => this.clearApiKey(), e.target));
        if (clearAiCache) clearAiCache.addEventListener('click', (e) => this.debounce(() => this.clearAiCache(), e.target));

        // Click outside to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadTabGroups() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getTabGroups' });
            this.tabGroups = response || {};
            this.renderTabGroups();
        } catch (error) {
            console.error('Error loading tab groups:', error);
            this.showError('Failed to load tab groups');
        }
    }

    renderTabGroups() {
        const container = document.getElementById('groupsContainer');
        container.innerHTML = '';

        if (Object.keys(this.tabGroups).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3>No tab groups yet</h3>
                    <p>Click "Organize" to automatically group your tabs</p>
                    <button class="btn btn-primary" id="emptyStateOrganizeBtn">
                        🤖 Organize Now
                    </button>
                </div>
            `;
            
            // Add event listener for the empty state button
            const emptyStateBtn = document.getElementById('emptyStateOrganizeBtn');
            if (emptyStateBtn) {
                emptyStateBtn.addEventListener('click', (e) => this.debounce(() => this.organizeAllTabs(), e.target));
            }
            return;
        }

        Object.entries(this.tabGroups).forEach(([groupName, tabs]) => {
            if (this.currentFilter && !this.matchesFilter(groupName, tabs)) {
                return;
            }

            const groupElement = this.createGroupElement(groupName, tabs);
            container.appendChild(groupElement);
        });
    }

    createGroupElement(groupName, tabs) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'tab-group';
        groupDiv.setAttribute('data-group-name', groupName);

        const groupColor = this.getGroupColor(groupName);
        
        groupDiv.innerHTML = `
            <div class="group-header" style="border-left-color: ${groupColor}">
                <div class="group-info">
                    <div class="group-title">
                        <span class="group-color-indicator" style="background-color: ${groupColor}"></span>
                        <span class="group-name" contenteditable="true">${groupName}</span>
                        <span class="tab-count">${tabs.length} tab${tabs.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="group-actions">
                        <button class="group-action-btn toggle-group-btn" title="Collapse/Expand" data-group="${groupName}">
                            <span class="collapse-icon">▼</span>
                        </button>
                        <button class="group-action-btn save-group-btn" title="Save Group" data-group="${groupName}">
                            💾
                        </button>
                        <button class="group-action-btn close-group-btn" title="Close All" data-group="${groupName}">
                            ✕
                        </button>
                    </div>
                </div>
            </div>
            <div class="group-tabs">
                ${tabs.map(tab => this.createTabElement(tab)).join('')}
            </div>
        `;

        // Add event listeners to group action buttons
        this.addGroupEventListeners(groupDiv, groupName);
        
        // Add drag and drop listeners
        this.addDragDropListeners(groupDiv);

        return groupDiv;
    }

    addGroupEventListeners(groupDiv, groupName) {
        // Toggle group button
        const toggleBtn = groupDiv.querySelector('.toggle-group-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleGroup(groupName));
        }

        // Save group button  
        const saveBtn = groupDiv.querySelector('.save-group-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveGroup(groupName));
        }

        // Close group button
        const closeBtn = groupDiv.querySelector('.close-group-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeGroup(groupName));
        }

        // Tab action buttons - use event delegation for dynamically created elements
        groupDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('switch-tab-btn') || e.target.closest('.switch-tab-btn')) {
                const btn = e.target.classList.contains('switch-tab-btn') ? e.target : e.target.closest('.switch-tab-btn');
                const tabId = parseInt(btn.dataset.tabId);
                if (tabId) {
                    this.switchToTab(tabId);
                }
            } else if (e.target.classList.contains('close-tab-btn') || e.target.closest('.close-tab-btn')) {
                const btn = e.target.classList.contains('close-tab-btn') ? e.target : e.target.closest('.close-tab-btn');
                const tabId = parseInt(btn.dataset.tabId);
                if (tabId) {
                    this.closeTab(tabId);
                }
            }
        });
    }

    createTabElement(tab) {
        const timeSinceAccess = this.getTimeSinceAccess(tab.lastAccessed);
        const isUnused = timeSinceAccess > 7; // 7 days threshold

        return `
            <div class="tab-item ${isUnused ? 'unused' : ''}" data-tab-id="${tab.id}" draggable="true">
                <div class="tab-favicon">
                    <img src="${tab.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>'}" 
                         alt="" onerror="this.style.display='none'">
                </div>
                <div class="tab-info">
                    <div class="tab-title" title="${tab.title}">${tab.title}</div>
                    <div class="tab-url" title="${tab.url}">${this.formatUrl(tab.url)}</div>
                    ${isUnused ? `<div class="tab-warning">Unused for ${Math.floor(timeSinceAccess)} days</div>` : ''}
                </div>
                <div class="tab-actions">
                    <button class="tab-action-btn switch-tab-btn" title="Switch to tab" data-tab-id="${tab.id}">
                        👁️
                    </button>
                    <button class="tab-action-btn close-tab-btn" title="Close tab" data-tab-id="${tab.id}">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }

    addDragDropListeners(groupElement) {
        const tabs = groupElement.querySelectorAll('.tab-item');
        
        tabs.forEach(tab => {
            tab.addEventListener('dragstart', (e) => {
                this.draggedElement = tab;
                tab.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            tab.addEventListener('dragend', () => {
                tab.classList.remove('dragging');
                this.draggedElement = null;
            });
        });

        const groupTabs = groupElement.querySelector('.group-tabs');
        
        groupTabs.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        groupTabs.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedElement && this.draggedElement.parentNode !== groupTabs) {
                groupTabs.appendChild(this.draggedElement);
                this.handleTabMoved(this.draggedElement, groupElement.dataset.groupName);
            }
        });
    }

    async handleTabMoved(tabElement, newGroupName) {
        const tabId = parseInt(tabElement.dataset.tabId);
        
        try {
            // Update the backend
            await chrome.runtime.sendMessage({
                action: 'moveTabToGroup',
                tabId: tabId,
                groupName: newGroupName
            });

            // Reload groups to reflect changes
            await this.loadTabGroups();
        } catch (error) {
            console.error('Error moving tab:', error);
            this.showError('Failed to move tab');
        }
    }

    getGroupColor(groupName) {
        const colors = {
            'work': '#4285f4',
            'shopping': '#34a853',
            'research': '#9c27b0',
            'entertainment': '#ea4335',
            'news': '#ff9800',
            'finance': '#00bcd4',
            'travel': '#e91e63',
            'health': '#9e9e9e',
            'general': '#757575'
        };
        return colors[groupName.toLowerCase()] || colors.general;
    }

    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url.substring(0, 30) + (url.length > 30 ? '...' : '');
        }
    }

    getTimeSinceAccess(timestamp) {
        return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    }

    matchesFilter(groupName, tabs) {
        if (!this.currentFilter) return true;
        
        const filter = this.currentFilter.toLowerCase();
        
        // Check group name
        if (groupName.toLowerCase().includes(filter)) return true;
        
        // Check tab titles and URLs
        return tabs.some(tab => 
            tab.title.toLowerCase().includes(filter) || 
            tab.url.toLowerCase().includes(filter)
        );
    }

    handleSearch(query) {
        this.currentFilter = query;
        this.renderTabGroups();
        
        // Show/hide clear button
        const clearBtn = document.getElementById('clearSearch');
        clearBtn.style.display = query ? 'block' : 'none';
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.currentFilter = '';
        this.renderTabGroups();
        document.getElementById('clearSearch').style.display = 'none';
    }

    async organizeAllTabs() {
        this.showLoading('Organizing tabs...');
        
        try {
            await chrome.runtime.sendMessage({ action: 'organizeAllTabs' });
            await this.loadTabGroups();
            this.updateStats();
            this.showSuccess('Tabs organized successfully!');
        } catch (error) {
            console.error('Error organizing tabs:', error);
            this.showError('Failed to organize tabs');
        } finally {
            this.hideLoading();
        }
    }

    async switchToTab(tabId) {
        try {
            await chrome.runtime.sendMessage({ action: 'switchToTab', tabId: tabId });
            window.close(); // Close popup after switching
        } catch (error) {
            console.error('Error switching to tab:', error);
            this.showError('Failed to switch to tab');
        }
    }

    async closeTab(tabId) {
        try {
            await chrome.runtime.sendMessage({ action: 'closeTab', tabId: tabId });
            await this.loadTabGroups();
            this.updateStats();
        } catch (error) {
            console.error('Error closing tab:', error);
            this.showError('Failed to close tab');
        }
    }

    toggleGroup(groupName) {
        console.log('Toggling group:', groupName);
        const groupElement = document.querySelector(`[data-group-name="${groupName}"]`);
        
        if (!groupElement) {
            console.error('Group element not found for:', groupName);
            return;
        }
        
        const groupTabs = groupElement.querySelector('.group-tabs');
        const collapseIcon = groupElement.querySelector('.collapse-icon');
        
        if (!groupTabs || !collapseIcon) {
            console.error('Group tabs or collapse icon not found');
            return;
        }
        
        if (groupTabs.style.display === 'none') {
            groupTabs.style.display = 'block';
            collapseIcon.textContent = '▼';
            console.log('Group expanded');
        } else {
            groupTabs.style.display = 'none';
            collapseIcon.textContent = '▶';
            console.log('Group collapsed');
        }
    }

    async saveGroup(groupName) {
        try {
            const groupData = this.tabGroups[groupName];
            await chrome.storage.local.set({
                [`savedGroup_${groupName}`]: groupData
            });
            this.showSuccess(`Group "${groupName}" saved!`);
        } catch (error) {
            console.error('Error saving group:', error);
            this.showError('Failed to save group');
        }
    }

    async closeGroup(groupName) {
        if (confirm(`Close all tabs in "${groupName}" group?`)) {
            try {
                const tabs = this.tabGroups[groupName];
                for (const tab of tabs) {
                    await chrome.runtime.sendMessage({ action: 'closeTab', tabId: tab.id });
                }
                await this.loadTabGroups();
                this.updateStats();
            } catch (error) {
                console.error('Error closing group:', error);
                this.showError('Failed to close group');
            }
        }
    }

    async cleanupUnusedTabs() {
        try {
            const unusedTabs = await chrome.runtime.sendMessage({ 
                action: 'getUnusedTabs', 
                dayThreshold: 7 
            });

            if (unusedTabs.length === 0) {
                this.showSuccess('No unused tabs found!');
                return;
            }

            if (confirm(`Found ${unusedTabs.length} unused tabs. Close them all?`)) {
                for (const tab of unusedTabs) {
                    await chrome.runtime.sendMessage({ action: 'closeTab', tabId: tab.id });
                }
                await this.loadTabGroups();
                this.updateStats();
                this.showSuccess(`Closed ${unusedTabs.length} unused tabs!`);
            }
        } catch (error) {
            console.error('Error cleaning up tabs:', error);
            this.showError('Failed to cleanup tabs');
        }
    }

    async createCustomGroup() {
        const groupName = document.getElementById('groupName').value.trim();
        const selectedColor = document.querySelector('.color-option.selected');
        
        if (!groupName) {
            this.showError('Please enter a group name');
            return;
        }

        if (this.selectedTabs.size === 0) {
            this.showError('Please select at least one tab');
            return;
        }

        const color = selectedColor ? selectedColor.dataset.color : 'grey';
        
        try {
            await chrome.runtime.sendMessage({
                action: 'createCustomGroup',
                name: groupName,
                tabIds: Array.from(this.selectedTabs),
                color: color
            });

            document.getElementById('createGroupModal').style.display = 'none';
            await this.loadTabGroups();
            this.updateStats();
            this.showSuccess(`Group "${groupName}" created!`);
        } catch (error) {
            console.error('Error creating group:', error);
            this.showError('Failed to create group');
        }
    }

    openSettings() {
        document.getElementById('settingsModal').style.display = 'block';
        this.loadSettings();
        this.checkAiStatus();
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.local.get(['autoOrganizeEnabled', 'unusedTabThreshold']);
            
            document.getElementById('autoOrganizeEnabled').checked = settings.autoOrganizeEnabled !== false;
            document.getElementById('unusedTabThreshold').value = settings.unusedTabThreshold || 7;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({
                autoOrganizeEnabled: document.getElementById('autoOrganizeEnabled').checked,
                unusedTabThreshold: parseInt(document.getElementById('unusedTabThreshold').value)
            });

            document.getElementById('settingsModal').style.display = 'none';
            this.showSuccess('Settings saved!');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings');
        }
    }

    async checkAiStatus() {
        try {
            const stats = await chrome.runtime.sendMessage({ action: 'getAiStats' });
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            const aiStats = document.getElementById('aiStats');
            
            if (stats.error) {
                statusIndicator.className = 'status-indicator error';
                statusText.textContent = 'AI not configured';
                aiStats.style.display = 'none';
            } else {
                statusIndicator.className = 'status-indicator success';
                statusText.textContent = 'AI ready';
                aiStats.style.display = 'block';
                
                document.getElementById('cacheSize').textContent = stats.size || 0;
                document.getElementById('aiPerformance').textContent = stats.hitRate || 'Ready';
            }
        } catch (error) {
            console.error('Error checking AI status:', error);
        }
    }

    toggleApiKeyVisibility() {
        const input = document.getElementById('geminiApiKey');
        const button = document.getElementById('toggleApiKey');
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    }

    async testApiKey() {
        const apiKey = document.getElementById('geminiApiKey').value.trim();
        
        if (!apiKey) {
            this.showError('Please enter an API key');
            return;
        }

        const testButton = document.getElementById('testApiKey');
        const originalText = testButton.textContent;
        testButton.textContent = 'Testing...';
        testButton.disabled = true;

        try {
            const result = await chrome.runtime.sendMessage({ 
                action: 'testApiKey', 
                apiKey: apiKey 
            });

            if (result.success) {
                this.showSuccess(`API key is valid! Test categorization: ${result.category}`);
            } else {
                this.showError(`API key test failed: ${result.error}`);
            }
        } catch (error) {
            this.showError('Failed to test API key');
        } finally {
            testButton.textContent = originalText;
            testButton.disabled = false;
        }
    }

    async saveApiKey() {
        const apiKey = document.getElementById('geminiApiKey').value.trim();
        
        if (!apiKey) {
            this.showError('Please enter an API key');
            return;
        }

        try {
            const result = await chrome.runtime.sendMessage({ 
                action: 'saveApiKey', 
                apiKey: apiKey 
            });

            if (result.success) {
                this.showSuccess('API key saved securely!');
                document.getElementById('geminiApiKey').value = '';
                this.checkAiStatus();
            } else {
                this.showError('Failed to save API key');
            }
        } catch (error) {
            this.showError('Error saving API key');
        }
    }

    async clearApiKey() {
        if (confirm('Are you sure you want to clear the API key? This will disable AI categorization.')) {
            try {
                const result = await chrome.runtime.sendMessage({ action: 'clearApiKey' });
                
                if (result.success) {
                    this.showSuccess('API key cleared');
                    this.checkAiStatus();
                } else {
                    this.showError('Failed to clear API key');
                }
            } catch (error) {
                this.showError('Error clearing API key');
            }
        }
    }

    async clearAiCache() {
        if (confirm('Clear AI categorization cache? This will reset all cached results.')) {
            try {
                const result = await chrome.runtime.sendMessage({ action: 'clearAiCache' });
                
                if (result.success) {
                    this.showSuccess('AI cache cleared');
                    this.checkAiStatus();
                } else {
                    this.showError('Failed to clear cache');
                }
            } catch (error) {
                this.showError('Error clearing cache');
            }
        }
    }

    updateStats() {
        const totalTabs = Object.values(this.tabGroups).reduce((sum, tabs) => sum + tabs.length, 0);
        const totalGroups = Object.keys(this.tabGroups).length;

        document.getElementById('tabCount').textContent = `${totalTabs} tab${totalTabs !== 1 ? 's' : ''}`;
        document.getElementById('groupCount').textContent = `${totalGroups} group${totalGroups !== 1 ? 's' : ''}`;
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.code) {
                case 'KeyF':
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                    break;
                case 'KeyO':
                    e.preventDefault();
                    this.debounce(() => this.organizeAllTabs());
                    break;
                case 'KeyG':
                    e.preventDefault();
                    this.debounce(() => this.quickGroupCurrentTab());
                    break;
            }
        }
        
        // Escape key to close modals
        if (e.code === 'Escape') {
            const openModal = document.querySelector('.modal[style*="display: block"], .modal[style*="display: flex"]');
            if (openModal) {
                openModal.style.display = 'none';
            }
        }
    }

    // Debounce method to prevent button spam and improve responsiveness
    debounce(func, button = null) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.7';
        }
        
        Promise.resolve(func()).finally(() => {
            this.isProcessing = false;
            if (button) {
                button.disabled = false;
                button.style.opacity = '1';
            }
        });
    }

    async quickGroupCurrentTab() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab) {
                await chrome.runtime.sendMessage({ 
                    action: 'quickGroup', 
                    tabId: activeTab.id 
                });
                this.showSuccess('Tab grouped successfully!');
                await this.loadTabGroups();
            }
        } catch (error) {
            console.error('Error in quick group:', error);
            this.showError('Failed to group current tab');
        }
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loadingIndicator');
        loading.querySelector('span').textContent = message;
        loading.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    async saveCurrentGroups() {
        try {
            this.showLoading('Saving current groups...');
            
            // Get current tab groups from Chrome
            const groups = await chrome.tabGroups.query({});
            const savedGroups = {};
            
            for (const group of groups) {
                const tabs = await chrome.tabs.query({ groupId: group.id });
                savedGroups[group.title || `Group ${group.id}`] = tabs.map(tab => ({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    favIconUrl: tab.favIconUrl
                }));
            }
            
            await chrome.storage.local.set({ savedGroups });
            this.showSuccess('Groups saved successfully!');
            
        } catch (error) {
            console.error('Error saving groups:', error);
            this.showError('Failed to save groups');
        } finally {
            this.hideLoading();
        }
    }

    async restoreGroups() {
        try {
            this.showLoading('Restoring saved groups...');
            
            const result = await chrome.storage.local.get(['savedGroups']);
            if (!result.savedGroups || Object.keys(result.savedGroups).length === 0) {
                this.showError('No saved groups found');
                return;
            }
            
            for (const [groupName, tabs] of Object.entries(result.savedGroups)) {
                const validTabs = tabs.filter(tab => tab.url && !tab.url.startsWith('chrome://'));
                if (validTabs.length > 0) {
                    // Create tabs and group them
                    const tabIds = [];
                    for (const tab of validTabs) {
                        try {
                            const newTab = await chrome.tabs.create({ url: tab.url, active: false });
                            tabIds.push(newTab.id);
                        } catch (error) {
                            console.warn('Failed to restore tab:', tab.url, error);
                        }
                    }
                    
                    if (tabIds.length > 0) {
                        await chrome.runtime.sendMessage({
                            action: 'createCustomGroup',
                            name: groupName,
                            tabIds: tabIds,
                            color: 'blue'
                        });
                    }
                }
            }
            
            this.showSuccess('Groups restored successfully!');
            await this.loadTabGroups();
            
        } catch (error) {
            console.error('Error restoring groups:', error);
            this.showError('Failed to restore groups');
        } finally {
            this.hideLoading();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '10px 15px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px',
            zIndex: '10000',
            backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        });

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize popup when DOM is loaded with better error handling
try {
    console.log('Starting Tab Organizer AI initialization...');
    window.tabOrganizerPopup = new TabOrganizerPopup();
} catch (error) {
    console.error('Failed to create TabOrganizerPopup instance:', error);
    
    // Show error message to user
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('groupsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 40px; color: #f44336;">
                    <h3>⚠️ Initialization Error</h3>
                    <p>Failed to start Tab Organizer AI</p>
                    <p style="font-size: 12px; opacity: 0.8;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    });
}