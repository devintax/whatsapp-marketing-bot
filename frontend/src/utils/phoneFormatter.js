/**
 * Frontend Phone Number Formatting Utility
 * Client-side phone validation and formatting for better UX
 */

/**
 * Normalize phone number (remove formatting, keep digits and +)
 * @param {string} phone - Phone number
 * @returns {string} - Normalized phone
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const hasPlus = String(phone).trim().startsWith('+');
  const digitsOnly = String(phone).replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Format phone as user types (US format)
 * @param {string} input - Current input
 * @returns {string} - Formatted input
 */
export function formatPhoneInput(input) {
  if (!input) return '';
  
  let cleaned = input.replace(/[^\d+]/g, '');
  const hasPlus = cleaned.startsWith('+');
  
  if (hasPlus) {
    cleaned = cleaned.slice(1);
  }
  
  let formatted = '';
  if (cleaned.length <= 3) {
    formatted = cleaned;
  } else if (cleaned.length <= 6) {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length <= 10) {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else {
    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    if (cleaned.length > 10) {
      formatted += ` ${cleaned.slice(10)}`;
    }
  }
  
  return hasPlus ? `+${cleaned}` : formatted;
}

/**
 * Validate phone number (client-side)
 * @param {string} phone - Phone to validate
 * @returns {Object} - { isValid, error }
 */
export function validatePhone(phone) {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  const normalized = normalizePhone(phone);
  const digitsOnly = normalized.replace(/^\+/, '');
  
  if (digitsOnly.length < 7) {
    return { isValid: false, error: 'Phone must have at least 7 digits' };
  }
  
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone cannot exceed 15 digits' };
  }
  
  if (!/^\+?\d+$/.test(normalized)) {
    return { isValid: false, error: 'Phone contains invalid characters' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Get example phone formats
 * @returns {string} - Example formats string
 */
export function getPhoneExample() {
  return 'e.g., (234) 567-8900, +1-234-567-8900, 2345678900';
}

/**
 * Format phone for display
 * @param {string} phone - Phone number
 * @returns {string} - Formatted for display
 */
export function formatPhoneDisplay(phone) {
  const normalized = normalizePhone(phone);
  const digitsOnly = normalized.replace(/^\+/, '');
  
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  return normalized;
}
