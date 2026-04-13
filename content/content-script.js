/**
 * Content Script - Design Arena
 * Handles UI cleanup and prompt injection for Design Arena
 * @module content-script
 * @author Mohammad Faiz
 * @version 1.4.0
 */

(() => {
  'use strict';

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const STYLE_ID = 'design-arena-cleanup';
  const STORAGE_KEY = 'design_arena_pending_action';
  const POLL_INTERVAL = 300; // 300ms - Balance between responsiveness and CPU usage
  const INITIAL_POLL_INTERVAL = 100; // 100ms - Aggressive initial polling for fast injection
  const INITIAL_POLL_DURATION = 10000; // 10s - Duration of fast polling window
  const MAX_TEXTAREA_ATTEMPTS = 15; // Retry attempts for finding textarea
  const ACTION_EXPIRY_MS = 60000; // 60s - Actions older than this are discarded
  const TEXTAREA_SEARCH_DELAY = 300; // 300ms - Delay between textarea search retries
  const ID_CLEANUP_INTERVAL = 60000; // 60s - Interval for cleaning up processed action IDs

  /**
   * Textarea selectors ordered by specificity
   */
  const TEXTAREA_SELECTORS = [
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="chat" i]',
    'textarea[placeholder*="type" i]',
    'textarea[placeholder*="ask" i]',
    'textarea[aria-label*="message" i]',
    'textarea[aria-label*="chat" i]',
    'textarea[aria-label*="input" i]',
    'textarea.svelte-1ed2p3z',
    'textarea[data-testid*="input"]',
    'textarea[role="textbox"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    'textarea'
  ];

  /**
   * Send button selectors
   */
  const BUTTON_SELECTORS = [
    'button[aria-label*="send" i]',
    'button[aria-label*="submit" i]',
    'button[title*="send" i]',
    'button[title*="submit" i]',
    'button:has(svg[data-testid="send"])',
    'button:has(svg):not([aria-label*="stop" i]):not([aria-label*="cancel" i])',
    'button.primary',
    'button[type="submit"]',
    'form button:last-of-type'
  ];

  // Track processed action IDs to prevent duplicates
  const processedActionIds = new Set();

  // Track if we're in initial fast-polling mode
  let isInitialPolling = true;
  let initStartTime = Date.now();

  // ============================================================================
  // LOGGING
  // ============================================================================

  const IS_PRODUCTION = (() => {
    try {
      const manifest = chrome.runtime.getManifest();
      return !manifest.version.includes('dev');
    } catch {
      return true;
    }
  })();

  const log = {
    info: (...args) => {
      if (!IS_PRODUCTION) {
        console.log('[Design Arena]', ...args);
      }
    },
    debug: (...args) => {
      if (!IS_PRODUCTION) {
        console.debug('[Design Arena]', ...args);
      }
    },
    error: (...args) => console.error('[Design Arena]', ...args),
    warn: (...args) => {
      if (!IS_PRODUCTION) {
        console.warn('[Design Arena]', ...args);
      }
    }
  };

  // ============================================================================
  // CSS INJECTION (Original functionality)
  // ============================================================================

  const injectHidingCSS = () => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      div.bg-surface-floating:has(p),
      div[class*="bg-surface-floating"]:has(svg),
      div.pointer-events-auto:has(a[href*="lmarena"]) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `;

    const head = document.head || document.documentElement;
    if (head) {
      head.appendChild(style);
    }
  };

  const observeStyleRemoval = () => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          for (const node of mutation.removedNodes) {
            if (node.id === STYLE_ID) {
              injectHidingCSS();
              break;
            }
          }
        }
      }
    });

    const head = document.head || document.documentElement;
    if (head) {
      observer.observe(head, { childList: true });
    }
  };

  // ============================================================================
  // TEXTAREA DETECTION
  // ============================================================================

  const isElementUsable = (element) => {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const style = window.getComputedStyle(element);
    const isNotHidden = style.display !== 'none' && style.visibility !== 'hidden';
    const isEditable = element.contentEditable === 'true' || (!element.disabled && !element.readOnly);

    return isVisible && isNotHidden && isEditable;
  };

  const findTextarea = async (attempt = 0) => {
    for (const selector of TEXTAREA_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (isElementUsable(element)) {
            log.debug('Found textarea with selector:', selector);
            return element;
          }
        }
      } catch {
        // Invalid selector, continue
      }
    }

    if (attempt < MAX_TEXTAREA_ATTEMPTS) {
      log.debug(`Textarea not found, retrying... (${attempt + 1}/${MAX_TEXTAREA_ATTEMPTS})`);
      await new Promise((resolve) => setTimeout(resolve, TEXTAREA_SEARCH_DELAY));
      return findTextarea(attempt + 1);
    }

    log.error('Could not find textarea after maximum attempts');
    return null;
  };

  // ============================================================================
  // VALUE INJECTION
  // ============================================================================

  const setTextareaValue = (textarea, value) => {
    // Handle contenteditable divs
    if (textarea.contentEditable === 'true') {
      // Use textContent only - safer than innerHTML
      textarea.textContent = value;
    } else {
      // Native value setter to bypass React's synthetic event system
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, value);
      } else {
        textarea.value = value;
      }
    }

    // Focus first
    textarea.focus();

    // Dispatch comprehensive events for React/Gradio/Vue compatibility
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: value
    });
    textarea.dispatchEvent(inputEvent);

    textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new Event('keyup', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a' }));
    textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'a' }));

    // Try to update React internal state - with additional safety checks
    try {
      const reactKey = Object.keys(textarea).find(
        (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key.startsWith('__react')
      );
      if (reactKey && textarea[reactKey]) {
        const fiber = textarea[reactKey];
        // Validate fiber object structure before accessing
        if (fiber && typeof fiber === 'object') {
          if (fiber.memoizedProps && typeof fiber.memoizedProps.onChange === 'function') {
            fiber.memoizedProps.onChange({ target: { value } });
          }
          if (typeof fiber.onChange === 'function') {
            fiber.onChange({ target: { value } });
          }
        }
      }
    } catch (error) {
      // React state update failed, continue - log at debug level
      log.debug('React state update failed', error);
    }

    log.info('Textarea value set successfully');
  };

  // ============================================================================
  // SEND BUTTON
  // ============================================================================

  const findSendButton = () => {
    for (const selector of BUTTON_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (isElementUsable(element)) {
            log.debug('Found send button with selector:', selector);
            return element;
          }
        }
      } catch {
        // Invalid selector, continue
      }
    }
    log.warn('Could not find send button');
    return null;
  };

  const clickSendButton = (button) => {
    button.focus();
    button.click();

    // Dispatch mouse events
    ['mousedown', 'mouseup', 'click'].forEach((eventType) => {
      try {
        button.dispatchEvent(new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      } catch {
        // Event dispatch failed
      }
    });

    log.debug('Send button clicked');
  };

  // ============================================================================
  // PROMPT INJECTION
  // ============================================================================

  const injectPrompt = async (prompt, actionId) => {
    try {
      if (processedActionIds.has(actionId)) {
        log.debug('Action already processed:', actionId);
        return false;
      }

      // Mark as processing immediately
      processedActionIds.add(actionId);

      log.info('Starting prompt injection for:', actionId);

      // Find textarea with retries
      const textarea = await findTextarea();
      if (!textarea) {
        log.error('Textarea not found');
        notifyBackground('PROMPT_INJECTION_FAILED', actionId, 'Textarea not found');
        return false;
      }

      // Set textarea value
      setTextareaValue(textarea, prompt);

      // Wait a bit for React to process
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Find and click send button
      const sendButton = findSendButton();
      if (sendButton) {
        clickSendButton(sendButton);
        log.info('Prompt injected and sent successfully');
      } else {
        log.info('Prompt injected (no send button found - user can press Enter)');
      }

      notifyBackground('PROMPT_INJECTED', actionId);
      return true;
    } catch (error) {
      log.error('Prompt injection failed:', error);
      notifyBackground('PROMPT_INJECTION_FAILED', actionId, error.message);
      return false;
    }
  };

  const notifyBackground = (type, actionId, error = null) => {
    try {
      chrome.runtime.sendMessage({
        type,
        actionId,
        error,
        timestamp: Date.now()
      });
    } catch {
      log.debug('Could not notify background script');
    }
  };

  // ============================================================================
  // PENDING ACTIONS - THE CORE FIX
  // ============================================================================

  const checkPendingActions = async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const action = result[STORAGE_KEY];

      if (!action || !action.prompt || !action.id) {
        return false;
      }

      // Check if action is expired
      const age = Date.now() - action.timestamp;
      if (age > ACTION_EXPIRY_MS) {
        log.debug('Action expired, discarding:', action.id);
        await chrome.storage.local.remove(STORAGE_KEY);
        return false;
      }

      // Check if already processed
      if (processedActionIds.has(action.id)) {
        log.debug('Action already processed:', action.id);
        await chrome.storage.local.remove(STORAGE_KEY);
        return false;
      }

      // CLEAR STORAGE FIRST to prevent duplicates
      await chrome.storage.local.remove(STORAGE_KEY);

      log.info('Processing pending action:', action.id, 'age:', age + 'ms');

      // Wait for page to be ready
      if (document.readyState !== 'complete') {
        log.debug('Waiting for page to complete loading...');
        await new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        });
      }

      // Additional wait for React/dynamic content
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Inject prompt
      await injectPrompt(action.prompt, action.id);
      return true;
    } catch (error) {
      log.error('Failed to check pending actions:', error);
      return false;
    }
  };

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  const handleMessage = (message, sender, sendResponse) => {
    if (message.type === 'INJECT_PROMPT') {
      log.info('Received INJECT_PROMPT message:', message.actionId);

      (async () => {
        const success = await injectPrompt(message.prompt, message.actionId);
        sendResponse({ success });
      })();

      return true;
    }

    return false;
  };

  // ============================================================================
  // POLLING SYSTEM - AGGRESSIVE INITIAL POLLING
  // ============================================================================

  let pollIntervalId = null;
  let fastPollIntervalId = null;

  const startPolling = () => {
    // Clear any existing intervals
    if (pollIntervalId) clearInterval(pollIntervalId);
    if (fastPollIntervalId) clearInterval(fastPollIntervalId);

    // FAST initial polling for first 10 seconds
    log.info('Starting fast initial polling (100ms) for 10 seconds...');
    fastPollIntervalId = setInterval(async () => {
      const found = await checkPendingActions();

      // Check if we should switch to normal polling
      if (Date.now() - initStartTime > INITIAL_POLL_DURATION) {
        log.debug('Switching to normal polling interval');
        clearInterval(fastPollIntervalId);
        fastPollIntervalId = null;
        isInitialPolling = false;
      }

      // If we found and processed an action, we can slow down
      if (found) {
        clearInterval(fastPollIntervalId);
        fastPollIntervalId = null;
        isInitialPolling = false;
      }
    }, INITIAL_POLL_INTERVAL);

    // Regular polling as backup
    pollIntervalId = setInterval(async () => {
      if (!isInitialPolling) {
        await checkPendingActions();
      }
    }, POLL_INTERVAL);

    log.debug('Polling started');
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const initialize = () => {
    log.info('Content script initializing v1.4.0 on:', window.location.href);

    // Store init time
    initStartTime = Date.now();
    isInitialPolling = true;

    // Inject CSS for UI cleanup
    injectHidingCSS();
    observeStyleRemoval();

    // Set up message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Start aggressive polling immediately
    startPolling();

    // Check immediately on initialization
    checkPendingActions();

    log.info('Content script initialized');
  };

  // Initialize based on document state
  if (document.readyState === 'loading') {
    // Defer to initialize() which starts polling — avoid duplicate intervals
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  // Also listen for load event as fallback
  window.addEventListener('load', () => {
    log.debug('Window load event - checking pending actions');
    checkPendingActions();
  }, { once: true });

  // Clean up processed action IDs periodically to prevent memory leaks
  setInterval(() => {
    const MAX_IDS = 100;
    const KEEP_IDS = 50;
    
    if (processedActionIds.size > MAX_IDS) {
      const idsToKeep = Array.from(processedActionIds).slice(-KEEP_IDS);
      processedActionIds.clear();
      idsToKeep.forEach((id) => processedActionIds.add(id));
      log.debug('Cleaned up processed action IDs');
    }
  }, ID_CLEANUP_INTERVAL);
})();
