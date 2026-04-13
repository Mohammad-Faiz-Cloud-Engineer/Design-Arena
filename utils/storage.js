/**
 * Storage Management Module
 * Professional wrapper for chrome.storage.local with error handling and data sanitization
 * @module storage
 * @author Mohammad Faiz
 * @version 1.4.0
 */

import { logger } from './logger.js';
import { CONFIG, ERROR_MESSAGES } from './constants.js';

/**
 * Sanitizes input data to prevent XSS and injection attacks
 * Enhanced with comprehensive edge case handling and circular reference detection
 * @param {*} data - Data to sanitize
 * @param {number} [depth=0] - Current recursion depth to prevent stack overflow
 * @param {WeakSet} [visited=new WeakSet()] - Track visited objects to detect cycles
 * @returns {*} Sanitized data
 */
const sanitizeData = (data, depth = 0, visited = new WeakSet()) => {
  // Prevent infinite recursion and stack overflow
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH) {
    logger.warn('Maximum sanitization depth exceeded');
    return null;
  }

  // Handle null and undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle strings with comprehensive XSS prevention using allowlist approach
  if (typeof data === 'string') {
    // Normalize unicode to prevent unicode-based XSS attacks
    let sanitized = data.normalize('NFKC');
    
    // Limit length first
    sanitized = sanitized.substring(0, CONFIG.VALIDATION.MAX_STRING_LENGTH);
    
    // Remove control characters (except newline, carriage return, tab) but preserve Unicode
    // This supports internationalization while blocking dangerous control chars
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove HTML tags
    let previous;
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } while (sanitized !== previous);
    
    // Remove dangerous patterns via stable do/while loops
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/javascript:/gi, '');
    } while (sanitized !== previous);
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/vbscript:/gi, '');
    } while (sanitized !== previous);
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/data:/gi, '');
    } while (sanitized !== previous);
    do {
      previous = sanitized;
      sanitized = sanitized.replace(/on\w+=/gi, '');
    } while (sanitized !== previous);
    
    // Remove remaining angle brackets
    sanitized = sanitized.replace(/[<>]/g, '');
    
    return sanitized;
  }
  
  // Handle numbers with safety checks - reject NaN and Infinity explicitly
  if (typeof data === 'number') {
    if (!Number.isFinite(data)) {
      logger.warn('Non-finite number detected (NaN or Infinity), converting to 0');
      return 0; // Return 0 instead of null to maintain data type consistency
    }
    return data;
  }
  
  // Handle booleans
  if (typeof data === 'boolean') {
    return data;
  }
  
  // Handle objects and arrays with prototype pollution prevention and cycle detection
  if (typeof data === 'object') {
    // Detect circular references
    if (visited.has(data)) {
      logger.warn('Circular reference detected, breaking cycle');
      return null;
    }
    
    // Reject non-plain objects and non-arrays
    const isPlainObject = Object.prototype.toString.call(data) === '[object Object]';
    const isArray = Array.isArray(data);
    
    if (!isPlainObject && !isArray) {
      return null;
    }
    
    // Mark this object as visited
    visited.add(data);
    
    const sanitized = isArray ? [] : {};
    
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
      
      // Prevent prototype pollution attacks
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      
      // Recursively sanitize with depth tracking and visited set
      sanitized[key] = sanitizeData(data[key], depth + 1, visited);
    }
    
    return sanitized;
  }
  
  // Reject functions, symbols, and other types
  return null;
};

/**
 * Validates data structure for storage
 * @param {*} data - Data to validate
 * @returns {boolean} Validation result
 */
const validateData = (data) => {
  if (data === null || data === undefined) {
    return false;
  }
  
  try {
    const stringified = JSON.stringify(data);
    if (stringified.length > CONFIG.STORAGE.MAX_SIZE_BYTES) {
      logger.warn('Data exceeds recommended storage size');
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks available storage quota
 * @returns {Promise<{usage: number, quota: number}>} Storage usage info
 */
const checkStorageQuota = async () => {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  } catch (error) {
    logger.debug('Storage quota check failed', error);
    return { usage: 0, quota: 0 };
  }
};

export const storage = Object.freeze({
  /**
   * Retrieves data from chrome.storage.local
   * @param {string|string[]} keys - Storage key(s) to retrieve
   * @returns {Promise<Object>} Retrieved data
   */
  async get(keys) {
    try {
      if (!keys) {
        throw new Error(ERROR_MESSAGES.KEYS_REQUIRED);
      }
      const result = await chrome.storage.local.get(keys);
      logger.debug('Storage read:', keys);
      return result;
    } catch (error) {
      logger.error(ERROR_MESSAGES.STORAGE_READ, error);
      throw new Error(ERROR_MESSAGES.STORAGE_READ);
    }
  },

  /**
   * Stores data in chrome.storage.local with sanitization
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async set(items) {
    try {
      if (!items || typeof items !== 'object' || Array.isArray(items)) {
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
      }
      
      if (!validateData(items)) {
        throw new Error(ERROR_MESSAGES.INVALID_DATA);
      }
      
      const sanitizedItems = sanitizeData(items);
      await chrome.storage.local.set(sanitizedItems);
      logger.debug('Storage write:', Object.keys(sanitizedItems));
    } catch (error) {
      if (error.message && error.message.includes('QUOTA_BYTES')) {
        logger.error(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED, error);
        throw new Error(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
      }
      logger.error(ERROR_MESSAGES.STORAGE_WRITE, error);
      throw new Error(ERROR_MESSAGES.STORAGE_WRITE);
    }
  },

  /**
   * Removes data from chrome.storage.local
   * @param {string|string[]} keys - Storage key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    try {
      if (!keys) {
        throw new Error(ERROR_MESSAGES.KEYS_REQUIRED);
      }
      await chrome.storage.local.remove(keys);
      logger.debug('Storage remove:', keys);
    } catch (error) {
      logger.error('Failed to remove from storage', error);
      throw error;
    }
  },

  /**
   * Clears all data from chrome.storage.local
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await chrome.storage.local.clear();
      logger.info('Storage cleared');
    } catch (error) {
      logger.error('Failed to clear storage', error);
      throw error;
    }
  },

  /**
   * Gets storage usage statistics
   * @returns {Promise<{usage: number, quota: number}>} Storage usage info
   */
  async getUsage() {
    return checkStorageQuota();
  }
});
