# Security Policy

## Supported Versions

We actively maintain and provide security updates for:

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | ✅ Yes             |
| 1.3.x   | ✅ Yes             |
| < 1.3   | ❌ No              |

## Security Features

Design Arena implements multiple security layers:

### 1. XSS Prevention
- Multi-layer input sanitization
- HTML tag stripping
- Script injection blocking
- Event handler removal
- Dangerous character filtering

### 2. Data Protection
- Sensitive data redaction in logs
- Email and token masking
- Storage quota management
- Input length limits
- Prototype pollution prevention

### 3. Secure Communication
- HTTPS only
- Content Security Policy headers
- Iframe sandboxing
- Minimal required permissions
- No external dependencies

### 4. Chrome Extension Security
- Manifest V3 (latest standard)
- Minimal permissions requested
- Service Worker architecture
- declarativeNetRequest for header modification
- No eval() or inline scripts

## Reporting a Vulnerability

**Please DO NOT open public GitHub issues for security vulnerabilities.**

### How to Report

Email security issues to: [your-email@example.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Updates**: Every 7 days until resolved
- **Fix Timeline**: 
  - Critical: 7 days
  - High: 14 days
  - Medium/Low: 30 days
- **Credit**: We'll credit you in CHANGELOG (unless you prefer anonymity)

## Security Best Practices

### For Users

**Installation:**
- Only install from official sources
- Verify extension ID
- Check permissions before installing

**Usage:**
- Keep extension updated
- Review CHANGELOG for security updates
- Report suspicious behavior

### For Developers

**Development:**
- Never commit `.pem` files
- Use environment variables for secrets
- Follow security guidelines
- Run security checks before releases

**Code:**
- Sanitize all inputs
- Validate data before storage
- Use provided security utilities
- Follow OWASP guidelines

## Known Security Considerations

### Frame Embedding
- Extension removes X-Frame-Options headers for designarena.ai
- Uses declarativeNetRequest (secure method)
- Only applies to designarena.ai domains
- Required for side panel functionality

### Storage
- Data stored locally using chrome.storage.local
- No data sent to external servers
- All data sanitized before storage
- Automatic cleanup of old data

### Permissions
- `sidePanel`: Required for side panel functionality
- `storage`: Required for user preferences
- `declarativeNetRequest`: Required for header modification
- `contextMenus`: Required for "Use this text" feature
- `<all_urls>`: Required for context menu on any page

## Compliance

Design Arena follows:
- OWASP Top 10 guidelines
- Chrome Extension security best practices
- WCAG 2.1 AA accessibility standards
- RFC 5322 email validation

## Security Audit History

| Date       | Version | Result | Notes                    |
|------------|---------|--------|--------------------------|
| 2026-04-13 | 1.4.0   | Pass   | Context menu simplified  |
| 2026-02-07 | 1.3.0   | Pass   | Enhanced XSS prevention  |
| 2026-01-15 | 1.0.0   | Pass   | Initial release          |

## Contact

For security concerns:
- Email: [your-email@example.com]
- GitHub: Open a private security advisory

---

**Last Updated**: April 13, 2026  
**Version**: 1.4.0
