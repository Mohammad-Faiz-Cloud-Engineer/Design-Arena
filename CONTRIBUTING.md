# Contributing to Design Arena

Thanks for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Testing](#testing)

## Code of Conduct

### Be Respectful

- Treat everyone with respect
- Welcome newcomers
- Give constructive feedback
- Focus on what's best for the project
- Be patient and helpful

### Not Acceptable

- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Unprofessional conduct

## Getting Started

### What You Need

- Chrome 114+ or any Chromium-based browser
- Basic knowledge of JavaScript, HTML, and CSS
- Understanding of Chrome Extension APIs
- Git for version control

### First Time?

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a branch for your changes
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Mohammad-Faiz-Cloud-Engineer/design-arena.git
cd design-arena
```

### 2. Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the extension folder

### 3. Make Changes

- Edit files in your code editor
- Reload the extension after changes
- Test everything works

## Coding Standards

### JavaScript

**Style:**
- Use ES6+ syntax (const/let, arrow functions, async/await)
- 2 spaces for indentation
- Single quotes for strings
- Semicolons always
- Max 120 characters per line

**Naming:**
- `camelCase` for variables and functions
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- Use descriptive names

**Example:**

```javascript
// Good
const getUserData = async (userId) => {
  try {
    const result = await storage.get(userId);
    return result;
  } catch (error) {
    logger.error('Failed to get user data', error);
    throw error;
  }
};

// Bad
function gUD(id) {
  var r = storage.get(id);
  return r;
}
```

**Documentation:**

Add JSDoc comments to functions:

```javascript
/**
 * Retrieves user data from storage
 * @param {string} userId - User's unique ID
 * @returns {Promise<Object>} User data object
 */
const getUserData = async (userId) => {
  // Implementation
};
```

### HTML

- Use semantic HTML5 elements
- Include ARIA labels for accessibility
- 2 spaces for indentation
- Double quotes for attributes

```html
<!-- Good -->
<button 
  id="refreshBtn" 
  aria-label="Refresh Design Arena" 
  type="button">
  Refresh
</button>

<!-- Bad -->
<div onclick="refresh()">Refresh</div>
```

### CSS

- Use CSS variables
- 2 spaces for indentation
- Group related properties
- Mobile-first approach

```css
/* Good */
:root {
  --color-primary: #1a73e8;
  --spacing-md: 16px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-primary);
}

/* Bad */
button {
  display: flex;
  background: blue;
  padding: 16px;
}
```

## Making Changes

### Commit Messages

Format:
```
<type>: <description>

[optional body]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

Examples:
```bash
feat: add text selection context menu
fix: resolve storage quota error
docs: update installation guide
```

### Branch Naming

- `feature/description` for new features
- `fix/description` for bug fixes
- `docs/description` for documentation

## Submitting Changes

### Before Submitting

- [ ] Test in Chrome
- [ ] No console errors
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Commit messages are clear

### Pull Request

1. Push your branch to your fork
2. Open a pull request on GitHub
3. Fill out the PR template
4. Wait for review
5. Address feedback
6. Get approval and merge

### PR Template

```markdown
## What does this PR do?
Brief description

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Other

## Testing
- [ ] Tested in Chrome 114+
- [ ] No console errors
- [ ] All features work

## Screenshots
Add if applicable
```

## Testing

### Manual Testing

- [ ] Extension loads without errors
- [ ] Side panel opens correctly
- [ ] Refresh button works
- [ ] Context menu "Use this text" works
- [ ] Text is sent to Design Arena
- [ ] No console errors
- [ ] Dark mode works
- [ ] Keyboard navigation works

### Browser Testing

Test in:
- Chrome 114+
- Edge 114+ (optional)

### Performance

- Memory usage < 5MB
- No memory leaks
- Works with multiple tabs

## Questions?

- Open a GitHub issue
- Check existing issues first
- Be clear and specific

## Recognition

Contributors are recognized in:
- CHANGELOG.md
- GitHub contributors page

---

**Thank you for contributing to Design Arena!**
