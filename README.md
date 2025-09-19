# Tab Organizer AI 🤖📂

A powerful Chrome extension that uses AI to automatically analyze, group, and organize your browser tabs by topic, project, or task. Reduce clutter and improve your workflow with intelligent tab management.

## 🌟 Features

### 🤖 AI-Powered Organization
- **Smart Content Analysis**: Analyzes page content, titles, and URLs to categorize tabs
- **Automatic Grouping**: Groups tabs into customizable categories (Work, Shopping, Research, Entertainment, etc.)
- **Context Detection**: Understands page context using meta tags, headings, and content structure

### 🎯 Tab Management
- **Drag & Drop Interface**: Manually adjust groups with intuitive drag-and-drop
- **Custom Groups**: Create user-defined projects or topics with custom names and rules
- **Quick Actions**: Fast access to organize, save, and restore tab groups
- **Smart Search**: Filter tabs by keyword, group, or date opened

### 💾 Session Management
- **Save & Restore**: Save tab groups for different sessions or projects
- **Import/Export**: Backup and sync your organization settings
- **Usage Statistics**: Track your productivity and tab organization patterns

### ⚡ Productivity Features
- **Cleanup Suggestions**: Notifications for tabs unused for extended periods
- **Keyboard Shortcuts**: Quick tab grouping and switching without mouse
- **Visual Indicators**: Color-coded tabs and group badges for easy identification
- **Performance Optimized**: Lightweight design that won't slow down your browser

## 🚀 Installation

### Method 1: Chrome Web Store (Recommended)
*Coming soon - extension will be published to Chrome Web Store*

### Method 2: Manual Installation (Developer Mode)

1. **Download the Extension**
   ```bash
   git clone https://github.com/your-username/Tab-Organizer-AI.git
   cd Tab-Organizer-AI
   ```

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `Tab-Organizer-AI` folder
   - The extension will appear in your browser toolbar

4. **Grant Permissions**
   - Click on the Tab Organizer AI icon
   - Allow the requested permissions for optimal functionality

## 🎮 Usage

### Getting Started

1. **First Launch**
   - Click the Tab Organizer AI icon in your toolbar
   - Click "Organize" to automatically group your current tabs
   - Review and adjust the AI-suggested groups

2. **Automatic Organization**
   - New tabs are automatically analyzed and grouped
   - The AI learns from your browsing patterns over time
   - Groups are color-coded for easy visual identification

### Key Features

#### 🤖 Smart Organization
- **Auto-Group**: Press `Ctrl+Shift+O` or click "Organize" to group all tabs
- **Quick Group**: Press `Ctrl+Shift+G` to quickly group the current tab
- **Search Tabs**: Press `Ctrl+Shift+F` to search through all your tabs

#### 📂 Group Management
- **Create Custom Groups**: Select tabs and create named groups
- **Rename Groups**: Click on group names to edit them inline
- **Collapse/Expand**: Click the arrow to hide/show group contents
- **Drag & Drop**: Move tabs between groups by dragging

#### 💾 Save & Restore
- **Save Groups**: Click the save icon to preserve current group layout
- **Restore Sessions**: Quickly restore previously saved tab arrangements
- **Export Data**: Backup your settings and groups to a file

#### 🧹 Cleanup Tools
- **Unused Tab Detection**: Automatically identifies tabs not accessed recently
- **Bulk Actions**: Close multiple unused tabs with one click
- **Smart Suggestions**: Get notified about tabs that could be closed

### Default Categories

The AI automatically recognizes these content types:

- **🔵 Work**: Office documents, emails, calendars, project management tools
- **🟢 Shopping**: E-commerce sites, product pages, shopping carts
- **🟣 Research**: Documentation, tutorials, academic content, StackOverflow
- **🔴 Entertainment**: Videos, music, games, social media
- **🟠 News**: News articles, blogs, current events
- **🔵 Finance**: Banking, investments, crypto, budgeting tools
- **🟡 Travel**: Flights, hotels, maps, weather, destinations
- **⚪ Health**: Medical sites, fitness, wellness, diet information

### Custom Categories

Create your own categories with:
- **Custom Names**: Name groups according to your projects
- **Color Coding**: Choose from 8 different colors
- **Keyword Rules**: Define keywords that automatically assign tabs
- **Manual Assignment**: Drag tabs to custom groups

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+O` | Organize all tabs automatically |
| `Ctrl+Shift+G` | Quick group current tab |
| `Ctrl+Shift+F` | Search/filter tabs |

*Shortcuts can be customized in Chrome's extension settings*

## 🔧 Settings & Configuration

Access settings by clicking the gear icon in the extension popup:

### Organization Settings
- **Auto-Organization**: Enable/disable automatic tab grouping
- **Grouping Sensitivity**: Adjust how aggressively tabs are grouped
- **Custom Categories**: Add, edit, or remove your own categories

### Cleanup Settings
- **Unused Tab Threshold**: Set how long before tabs are marked as unused (1-30 days)
- **Cleanup Notifications**: Enable/disable cleanup suggestions
- **Auto-Close**: Automatically close very old unused tabs

### Appearance
- **Theme**: Choose between light and dark modes
- **Color Scheme**: Customize group colors
- **Compact View**: Reduce spacing for more content

### Privacy & Data
- **Local Storage**: All data is stored locally on your device
- **No Tracking**: The extension doesn't track or send your browsing data
- **Export/Import**: Backup your settings and groups

## 🛠️ Development

### Project Structure
```
Tab-Organizer-AI/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script for page analysis
├── popup.html            # Main popup interface
├── scripts/
│   ├── popup.js          # Popup functionality
│   └── storage.js        # Storage management utilities
├── styles/
│   └── popup.css         # Main styling
└── icons/               # Extension icons (add your own)
```

### Building from Source

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/Tab-Organizer-AI.git
   cd Tab-Organizer-AI
   ```

2. **Install in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

3. **Make Changes**
   - Edit the source files
   - Reload the extension in Chrome to see changes

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **Memory Usage**: < 10MB typical usage
- **CPU Impact**: Minimal background processing
- **Storage**: < 5MB for settings and group data
- **Network**: No external API calls required

## 🔒 Privacy & Security

- **Local Data Only**: All processing happens locally on your device
- **No External Servers**: No data is sent to external services
- **Minimal Permissions**: Only requests necessary Chrome API access
- **Open Source**: Full source code available for review

## 🐛 Troubleshooting

### Common Issues

**Extension not working after Chrome update:**
- Reload the extension in `chrome://extensions/`
- Check if developer mode is still enabled

**Groups not saving:**
- Ensure Chrome has sufficient storage space
- Check extension permissions in Chrome settings

**Slow performance:**
- Reduce the number of open tabs
- Clear extension storage in settings
- Restart Chrome

**AI categorization not accurate:**
- Train the AI by manually moving tabs to correct groups
- Add custom keywords in category settings
- Report issues for improvement

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join discussions in the issues section

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome Extensions API documentation
- The open-source community for inspiration and best practices
- Beta testers and early adopters for feedback

## 📈 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Cloud sync across devices
- [ ] Advanced AI training options
- [ ] Custom JavaScript rules for categorization
- [ ] Integration with popular productivity tools

### Version 1.2 (Future)
- [ ] Machine learning model improvements
- [ ] Multi-language support
- [ ] Advanced analytics and insights
- [ ] Browser sync with Firefox/Edge versions

---

**Made with ❤️ for productivity enthusiasts**

*Tab Organizer AI - Transform your chaotic tabs into organized productivity!*
