# Design Arena

<p align="center">
  <img src="icons/png/icon128.png" alt="Design Arena Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Build projects with AI using prompts</strong>
</p>

**Version:** 1.4.0

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/Mohammad-Faiz-Cloud-Engineer/design-arena)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-114%2B-brightgreen.svg)](https://www.google.com/chrome/)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

Build projects with AI using prompts. Design Arena in your browser's side panel - select any text and send it directly to start creating.

## Author

**Mohammad Faiz** - Creator & Developer

## Features

- **Side Panel Access**: Design Arena always available in your browser's side panel
- **Text Selection**: Right-click any text on any webpage and send it to Design Arena with "Use this text"
- **Quick Launch**: Click the extension icon to open Design Arena instantly
- **Persistent Session**: Your work stays open across tabs and windows
- **Refresh Button**: Reload Design Arena anytime with the bottom-right refresh button
- **Zero Dependencies**: Pure vanilla JavaScript, no external libraries
- **Dark Mode**: Automatic theme switching based on your system preferences
- **Lightweight**: Under 5MB, minimal resource usage

## What is Design Arena?

Design Arena is an AI-powered tool that helps you build projects using natural language prompts. Whether you're creating websites, apps, or designs, Design Arena turns your ideas into reality through conversation.

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder

### From Chrome Web Store

Coming soon!

## How to Use

### Basic Usage

1. Click the Design Arena icon in your Chrome toolbar
2. The side panel opens with Design Arena loaded
3. Start chatting and building your project
4. The panel stays open as you browse

### Using Selected Text

1. Select any text on any webpage
2. Right-click and choose "Use this text"
3. Design Arena opens with your selected text ready to use
4. Add your instructions and start building

### Refresh

If Design Arena needs a reload, click the small refresh button in the bottom-right corner of the panel.

## Project Structure

```
├── manifest.json              # Extension configuration
├── rules.json                 # Header modification rules
├── icons/                     # Extension icons
├── background/
│   └── service-worker.js      # Background processes
├── content/
│   ├── content-script.js      # Page interaction
│   └── content-style.css      # Injected styles
├── sidepanel/
│   ├── sidepanel.html         # Side panel UI
│   ├── scripts/
│   │   └── main.js            # Panel logic
│   └── styles/
│       ├── reset.css          # CSS reset
│       └── sidepanel.css      # Panel styles
└── utils/
    ├── constants.js           # App constants
    ├── logger.js              # Logging utility
    ├── storage.js             # Storage management
    └── user-details.js        # User data handling
```

## Technical Details

### Header Modification

The extension uses Chrome's `declarativeNetRequest` API to remove frame-blocking headers from designarena.ai:
- `X-Frame-Options`
- `Content-Security-Policy`
- `Frame-Options`

This allows Design Arena to load in the side panel while maintaining security.

### Storage

User preferences and session data are stored using `chrome.storage.local` with:
- Data sanitization to prevent XSS
- Input validation
- Error handling
- Automatic cleanup

### Performance

- Service Worker architecture for minimal resource usage
- Optimized CSS with variables
- Lazy loading with visual feedback
- No external dependencies

## Browser Compatibility

- Chrome 114+
- Edge 114+
- Any Chromium-based browser with Manifest V3 support

## Development

### Setup

```bash
git clone https://github.com/Mohammad-Faiz-Cloud-Engineer/design-arena.git
cd design-arena
```

Load the extension in Chrome as described in the Installation section.

### Making Changes

1. Edit the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Design Arena extension
4. Test your changes

### Code Style

- ES6+ JavaScript
- 2-space indentation
- JSDoc comments for functions
- Semantic HTML
- CSS variables for theming

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

Security is important. Please read [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities.

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Read the documentation

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Created by Mohammad Faiz**  
**Version 1.4.0**
