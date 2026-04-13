/**
 * User Details Management Module
 * Handles user data with professional error handling and validation
 * @module user-details
 * @author Mohammad Faiz
 * @version 1.4.0
 */

import { storage } from './storage.js';
import { CONFIG, ERROR_MESSAGES } from './constants.js';
import { logger } from './logger.js';

/**
 * Validates user details structure
 * @param {Object} details - User details object
 * @returns {boolean} Validation result
 */
const validateUserDetails = (details) => {
  if (!details || typeof details !== 'object') {
    return false;
  }
  
  const hasValidName = typeof details.name === 'string' && 
                       details.name.length <= CONFIG.VALIDATION.MAX_NAME_LENGTH;
  const hasValidEmail = typeof details.email === 'string' && 
                        details.email.length <= CONFIG.VALIDATION.MAX_EMAIL_LENGTH;
  const hasValidLastActive = details.lastActive === null || 
                             (typeof details.lastActive === 'string' && isValidISODate(details.lastActive));
  
  return hasValidName && hasValidEmail && hasValidLastActive;
};

/**
 * Validates ISO date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Validation result
 */
const isValidISODate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} Validation result
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return true; // Empty is valid
  return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Sanitizes user input with enhanced XSS prevention using allowlist approach
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input, maxLength) => {
  if (typeof input !== 'string') return '';
  
  // Normalize unicode to prevent unicode-based XSS attacks
  let sanitized = input.normalize('NFKC').trim();
  
  // Limit length first
  sanitized = sanitized.substring(0, maxLength);
  
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
};

export const userDetails = Object.freeze({
  /**
   * Initializes user details with default values
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const existing = await this.get();
      
      // Only initialize if no valid data exists
      if (!existing.name && !existing.email) {
        await storage.set({
          [CONFIG.STORAGE_KEYS.USER_DETAILS]: { ...CONFIG.DEFAULTS.USER_DETAILS }
        });
        logger.info('User details initialized with defaults');
      }
    } catch (error) {
      logger.error('Failed to initialize user details', error);
      throw error;
    }
  },

  /**
   * Retrieves user details from storage
   * @returns {Promise<Object>} User details object
   */
  async get() {
    try {
      const result = await storage.get(CONFIG.STORAGE_KEYS.USER_DETAILS);
      const details = result[CONFIG.STORAGE_KEYS.USER_DETAILS];
      
      if (!details || !validateUserDetails(details)) {
        logger.warn('Invalid user details found, returning defaults');
        return { ...CONFIG.DEFAULTS.USER_DETAILS };
      }
      
      return details;
    } catch (error) {
      logger.error('Failed to get user details', error);
      return { ...CONFIG.DEFAULTS.USER_DETAILS };
    }
  },

  /**
   * Saves user details to storage
   * @param {Object} details - User details object
   * @returns {Promise<void>}
   */
  async save(details) {
    try {
      if (!validateUserDetails(details)) {
        throw new Error(ERROR_MESSAGES.INVALID_USER_DETAILS);
      }
      
      if (details.email && !validateEmail(details.email)) {
        throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
      }
      
      const dataToSave = {
        name: sanitizeInput(details.name, CONFIG.VALIDATION.MAX_NAME_LENGTH),
        email: sanitizeInput(details.email, CONFIG.VALIDATION.MAX_EMAIL_LENGTH),
        lastActive: new Date().toISOString()
      };
      
      await storage.set({
        [CONFIG.STORAGE_KEYS.USER_DETAILS]: dataToSave
      });
      
      logger.info('User details saved successfully');
    } catch (error) {
      logger.error('Failed to save user details', error);
      throw error;
    }
  },

  /**
   * Updates last visit timestamp
   * @returns {Promise<void>}
   */
  async updateLastVisit() {
    try {
      const timestamp = new Date().toISOString();
      await storage.set({
        [CONFIG.STORAGE_KEYS.LAST_VISIT]: timestamp
      });
      logger.debug('Last visit updated');
    } catch (error) {
      logger.error('Failed to update last visit', error);
      // Don't throw - this is non-critical
    }
  },

  /**
   * Clears user details from storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await storage.remove(CONFIG.STORAGE_KEYS.USER_DETAILS);
      logger.info('User details cleared');
    } catch (error) {
      logger.error('Failed to clear user details', error);
      throw error;
    }
  }
});
