/**
 * Phone Number Validation and Formatting Utility
 * Supports multiple international formats and provides flexible validation
 * 
 * Supported formats:
 * - International: +1234567890, +1 (234) 567-8900
 * - US/Canada: (234) 567-8900, 234-567-8900, 234.567.8900
 * - Simple: 1234567890
 * - With spaces: 123 456 7890, +1 123 456 7890
 */

/**
 * Normalize phone number by removing all non-digit characters except leading +
 * @param {string} phone - Phone number in any format
 * @returns {string} - Normalized phone number (digits only, with optional leading +)
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  // Convert to string and trim
  const phoneStr = String(phone).trim();
  
  // Check if it starts with +
  const hasPlus = phoneStr.startsWith('+');
  
  // Extract only digits
  const digitsOnly = phoneStr.replace(/\D/g, '');
  
  // Return with + prefix if original had it
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Validate if phone number is valid
 * @param {string} phone - Phone number to validate
 * @returns {Object} - { isValid: boolean, error: string | null, normalized: string }
 */
function validatePhoneNumber(phone) {
  if (!phone) {
    return {
      isValid: false,
      error: 'Phone number is required',
      normalized: ''
    };
  }

  const normalized = normalizePhoneNumber(phone);
  
  // Remove + for digit count
  const digitsOnly = normalized.replace(/^\+/, '');
  
  // Validate minimum length (at least 7 digits for local numbers)
  if (digitsOnly.length < 7) {
    return {
      isValid: false,
      error: 'Phone number must have at least 7 digits',
      normalized
    };
  }
  
  // Validate maximum length (15 digits is max for international numbers)
  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      error: 'Phone number cannot exceed 15 digits',
      normalized
    };
  }
  
  // Validate format (only digits after normalization)
  if (!/^\+?\d+$/.test(normalized)) {
    return {
      isValid: false,
      error: 'Phone number contains invalid characters',
      normalized
    };
  }
  
  return {
    isValid: true,
    error: null,
    normalized
  };
}

/**
 * Format phone number for display (US format)
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
function formatPhoneForDisplay(phone) {
  const normalized = normalizePhoneNumber(phone);
  const digitsOnly = normalized.replace(/^\+/, '');
  
  // US/Canada format (10 digits)
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // US/Canada with country code (11 digits starting with 1)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // International format with +
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  // Default: return normalized
  return normalized;
}

/**
 * Auto-format phone number as user types (for input fields)
 * @param {string} input - Current input value
 * @returns {string} - Partially formatted phone number
 */
function autoFormatPhone(input) {
  if (!input) return '';
  
  // Remove all non-digit characters except +
  let cleaned = input.replace(/[^\d+]/g, '');
  
  // If starts with +, keep it
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.slice(1); // Remove + temporarily
  }
  
  // Apply US formatting for 10-digit numbers
  let formatted = '';
  if (cleaned.length <= 3) {
    formatted = cleaned;
  } else if (cleaned.length <= 6) {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length <= 10) {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else {
    // For numbers longer than 10 digits, just add dashes
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    if (cleaned.length > 10) {
      formatted += ` ${cleaned.slice(10)}`;
    }
  }
  
  // Re-add + if it was there
  return hasPlus ? `+${cleaned}` : formatted;
}

/**
 * Get example phone formats for user guidance
 * @returns {Array<string>} - Array of example phone formats
 */
function getPhoneExamples() {
  return [
    '+1 (234) 567-8900',
    '(234) 567-8900',
    '234-567-8900',
    '2345678900',
    '+44 20 7123 4567'
  ];
}

/**
 * Check if two phone numbers are the same (normalized comparison)
 * @param {string} phone1 - First phone number
 * @param {string} phone2 - Second phone number
 * @returns {boolean} - True if phones are the same
 */
function arePhonesEqual(phone1, phone2) {
  const norm1 = normalizePhoneNumber(phone1);
  const norm2 = normalizePhoneNumber(phone2);
  
  // Compare normalized versions
  return norm1 === norm2 || 
         norm1.replace(/^\+1/, '') === norm2.replace(/^\+1/, ''); // Handle US +1 country code
}

module.exports = {
  normalizePhoneNumber,
  validatePhoneNumber,
  formatPhoneForDisplay,
  autoFormatPhone,
  getPhoneExamples,
  arePhonesEqual
};
