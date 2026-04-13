/**
 * Side Panel Main Script
 * Handles iframe loading, refresh functionality, user interactions, and prompt forwarding
 * @module main
 * @author Mohammad Faiz
 * @version 1.4.0
 */

import { logger } from '../../utils/logger.js';
import { userDetails } from '../../utils/user-details.js';
import { CONFIG, ERROR_MESSAGES } from '../../utils/constants.js';

// ============================================================================
// DOM REFERENCES
// ============================================================================

let arenaFrame = null;
let loadingOverlay = null;
let refreshBtn = null;
let loadTimeout = null;
let refreshDebounceTimer = null;

// Track processed actions to prevent duplicates
const processedActionIds = new Set();

// ============================================================================
// DOM INITIALIZATION
// ============================================================================

/**
 * Initializes DOM element references
 * @throws {Error} If required DOM elements are not found
 */
const initializeDOMReferences = () => {
  arenaFrame = document.getElementById('arenaFrame');
  loadingOverlay = document.getElementById('loadingOverlay');
  refreshBtn = document.getElementById('refreshBtn');

  if (!arenaFrame || !loadingOverlay || !refreshBtn) {
    throw new Error(ERROR_MESSAGES.MISSING_DOM_ELEMENTS);
  }
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================

/**
 * Hides the loading overlay with smooth transition
 */
const hideLoadingOverlay = () => {
  if (!loadingOverlay) return;

  if (loadTimeout) {
    clearTimeout(loadTimeout);
    loadTimeout = null;
  }

  loadingOverlay.classList.add('hidden');
  setTimeout(() => {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }, CONFIG.TIMEOUTS.OVERLAY_TRANSITION);
};

/**
 * Shows the loading overlay
 */
const showLoadingOverlay = () => {
  if (!loadingOverlay) return;

  loadingOverlay.style.display = 'flex';
  void loadingOverlay.offsetWidth; // Force reflow
  loadingOverlay.classList.remove('hidden');
};

// ============================================================================
// IFRAME MANAGEMENT
// ============================================================================

/**
 * Debounced refresh function to prevent rapid clicks
 */
const refreshArenaFrame = () => {
  if (refreshDebounceTimer) {
    logger.debug('Refresh debounced');
    return;
  }

  try {
    if (!arenaFrame) {
      logger.error('Arena frame not initialized');
      return;
    }

    showLoadingOverlay();
    arenaFrame.src = CONFIG.ARENA_URL;
    logger.info('Arena frame refreshed');

    refreshDebounceTimer = setTimeout(() => {
      refreshDebounceTimer = null;
    }, 1000);
  } catch (error) {
    logger.error('Failed to refresh frame', error);
    hideLoadingOverlay();
  }
};

/**
 * Handles iframe load event
 */
const handleIframeLoad = () => {
  hideLoadingOverlay();
  logger.info('Design Arena loaded successfully');

  userDetails.updateLastVisit().catch((err) =>
    logger.debug('Failed to update last visit', err)
  );
};

/**
 * Handles iframe error event
 * @param {Event} error - Error event
 */
const handleIframeError = (error) => {
  logger.error('Failed to load Design Arena', error);
  hideLoadingOverlay();
};

/**
 * Initializes iframe event listeners
 */
const initializeIframe = () => {
  if (!arenaFrame) return;

  arenaFrame.addEventListener('load', handleIframeLoad, { once: false });
  arenaFrame.addEventListener('error', handleIframeError, { once: false });

  loadTimeout = setTimeout(hideLoadingOverlay, CONFIG.TIMEOUTS.LOADING_OVERLAY);
};

// ============================================================================
// PROMPT FORWARDING
// ============================================================================

/**
 * Forwards a prompt to the Design Arena iframe
 * @param {string} prompt - Prompt to forward
 * @param {string} actionId - Action ID for tracking
 * @returns {boolean} Success status
 */
const forwardToIframe = (prompt, actionId) => {
  if (!arenaFrame || !arenaFrame.contentWindow) {
    logger.warn('Iframe not ready for message forwarding');
    return false;
  }

  try {
    arenaFrame.contentWindow.postMessage(
      {
        type: 'DESIGN_ARENA_INJECT_PROMPT',
        prompt,
        actionId,
        timestamp: Date.now()
      },
      'https://designarena.ai'
    );

    logger.debug('Prompt forwarded to iframe', { actionId });
    return true;
  } catch (error) {
    logger.error('Failed to forward prompt to iframe', error);
    return false;
  }
};

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handles messages from the background script
 */
const handleMessage = (message, _sender, sendResponse) => {
  if (message.type === 'INJECT_PROMPT') {
    logger.debug('Received INJECT_PROMPT in sidepanel');

    // Check if already processed
    if (processedActionIds.has(message.actionId)) {
      sendResponse({ success: false, reason: 'Already processed' });
      return true;
    }

    processedActionIds.add(message.actionId);
    const success = forwardToIframe(message.prompt, message.actionId);
    sendResponse({ success });
    return true;
  }

  return false;
};

// ============================================================================
// REFRESH BUTTON
// ============================================================================

let hoverTimer = null;
let isRedirectMode = false;

/**
 * Opens Design Arena in a new tab
 */
const openInNewTab = () => {
  chrome.tabs.create({ url: CONFIG.ARENA_URL });
  logger.info('Opened Design Arena in new tab');
};

/**
 * Switches button to redirect mode
 */
const switchToRedirectMode = () => {
  if (!refreshBtn || isRedirectMode) return;
  
  isRedirectMode = true;
  refreshBtn.classList.add('redirect-mode');
  refreshBtn.setAttribute('aria-label', 'Open Design Arena in new tab');
  refreshBtn.setAttribute('title', 'Open in new tab');
  
  // Update SVG icon to external link icon
  refreshBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 2L9 3L12.3 3L6 9.3L6.7 10L13 3.7L13 7L14 7L14 2L9 2ZM3 3C2.4 3 2 3.4 2 4L2 13C2 13.6 2.4 14 3 14L12 14C12.6 14 13 13.6 13 13L13 9L12 9L12 13L3 13L3 4L7 4L7 3L3 3Z" fill="currentColor"/>
    </svg>
    <span id="refreshDescription" class="sr-only">Click to open Design Arena in new tab</span>
  `;
  
  logger.debug('Switched to redirect mode');
};

/**
 * Switches button back to refresh mode
 */
const switchToRefreshMode = () => {
  if (!refreshBtn || !isRedirectMode) return;
  
  isRedirectMode = false;
  refreshBtn.classList.remove('redirect-mode');
  refreshBtn.setAttribute('aria-label', 'Refresh Design Arena');
  refreshBtn.setAttribute('title', 'Refresh');
  
  // Restore refresh icon
  refreshBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.65 2.35C12.2 0.9 10.21 0 8 0 3.58 0 0.01 3.58 0.01 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" fill="currentColor"/>
    </svg>
    <span id="refreshDescription" class="sr-only">Click to reload Design Arena interface</span>
  `;
  
  logger.debug('Switched to refresh mode');
};

/**
 * Handles button click based on current mode
 */
const handleButtonClick = () => {
  if (isRedirectMode) {
    openInNewTab();
  } else {
    refreshArenaFrame();
  }
};

/**
 * Initializes refresh button with keyboard support and hover functionality
 */
const initializeRefreshButton = () => {
  if (!refreshBtn) return;

  // Click handler
  refreshBtn.addEventListener('click', handleButtonClick, { passive: true });

  // Keyboard support
  refreshBtn.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleButtonClick();
      }
    },
    { passive: false }
  );

  // Hover to switch to redirect mode (after 1 second)
  refreshBtn.addEventListener('mouseenter', () => {
    hoverTimer = setTimeout(() => {
      switchToRedirectMode();
    }, 1000); // 1 second hover delay
  });

  // Mouse leave - cancel timer or switch back
  refreshBtn.addEventListener('mouseleave', () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    
    // Switch back to refresh mode after a short delay
    setTimeout(() => {
      switchToRefreshMode();
    }, 300);
  });
};

// ============================================================================
// VISIBILITY HANDLING
// ============================================================================

/**
 * Handles visibility change to optimize performance
 */
const handleVisibilityChange = () => {
  if (document.hidden) {
    logger.debug('Side panel hidden');
  } else {
    logger.debug('Side panel visible');

    userDetails.updateLastVisit().catch((err) =>
      logger.debug('Failed to update last visit', err)
    );
  }
};

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Cleanup function for event listeners
 */
const cleanup = () => {
  if (arenaFrame) {
    arenaFrame.removeEventListener('load', handleIframeLoad);
    arenaFrame.removeEventListener('error', handleIframeError);
  }
  if (refreshBtn) {
    refreshBtn.removeEventListener('click', refreshArenaFrame);
  }
  if (loadTimeout) {
    clearTimeout(loadTimeout);
  }
  if (refreshDebounceTimer) {
    clearTimeout(refreshDebounceTimer);
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  chrome.runtime.onMessage.removeListener(handleMessage);
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the side panel
 * @returns {Promise<void>}
 */
const initialize = async () => {
  try {
    logger.info('Initializing side panel v1.4.0');

    initializeDOMReferences();
    initializeIframe();
    initializeRefreshButton();

    // Set up message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true
    });

    // Initial user activity update
    userDetails.updateLastVisit().catch((err) =>
      logger.debug('Failed to update last visit', err)
    );

    logger.info('Side panel initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize side panel', error);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup, { once: true });

// Clean up processed action IDs periodically to prevent memory leaks
setInterval(() => {
  const MAX_IDS = 100;
  const KEEP_IDS = 50;
  
  if (processedActionIds.size > MAX_IDS) {
    const idsToKeep = Array.from(processedActionIds).slice(-KEEP_IDS);
    processedActionIds.clear();
    idsToKeep.forEach((id) => processedActionIds.add(id));
    logger.debug('Cleaned up processed action IDs');
  }
}, 60000);
