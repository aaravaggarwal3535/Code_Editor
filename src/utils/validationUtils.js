/**
 * Utility functions for validating inputs
 */

/**
 * Email validation
 * @param {string} email - Email address to validate
 * @returns {boolean} - Is the email valid
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Password validation
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result with isValid and message
 */
export const validatePassword = (password, options = {}) => {
  const defaultOptions = {
    minLength: 8,
    requireNumbers: true,
    requireLowercase: true,
    requireUppercase: true,
    requireSpecial: true,
    ...options
  };
  
  const validations = [
    {
      condition: password?.length >= defaultOptions.minLength,
      message: `Password must be at least ${defaultOptions.minLength} characters long`
    },
    {
      condition: !defaultOptions.requireNumbers || /\d/.test(password),
      message: 'Password must contain at least one number'
    },
    {
      condition: !defaultOptions.requireLowercase || /[a-z]/.test(password),
      message: 'Password must contain at least one lowercase letter'
    },
    {
      condition: !defaultOptions.requireUppercase || /[A-Z]/.test(password),
      message: 'Password must contain at least one uppercase letter'
    },
    {
      condition: !defaultOptions.requireSpecial || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      message: 'Password must contain at least one special character'
    }
  ];
  
  const failedValidation = validations.find(v => !v.condition);
  
  return {
    isValid: !failedValidation,
    message: failedValidation?.message || 'Password is valid'
  };
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} - Is the URL valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * File name validation
 * @param {string} fileName - File name to validate
 * @returns {boolean} - Is the file name valid
 */
export const isValidFileName = (fileName) => {
  // Disallow these characters: \ / : * ? " < > |
  const regex = /^[^\\/:*?"<>|]+$/;
  return regex.test(fileName);
};

/**
 * Code validation for specific languages
 * @param {string} code - Code to validate
 * @param {string} language - Programming language
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateCode = (code, language) => {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return validateJavaScript(code);
    case 'html':
      return validateHTML(code);
    case 'css':
      return validateCSS(code);
    default:
      return { isValid: true, errors: [] };
  }
};

/**
 * Basic JavaScript validation
 * @param {string} code - JavaScript code to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validateJavaScript = (code) => {
  const errors = [];
  
  try {
    // Use Function constructor as a basic syntax check
    new Function(code);
  } catch (e) {
    errors.push({
      message: e.message,
      line: extractLineNumber(e.message)
    });
  }
  
  // Check for unclosed brackets/braces
  const openingBraces = (code.match(/\{/g) || []).length;
  const closingBraces = (code.match(/\}/g) || []).length;
  
  if (openingBraces !== closingBraces) {
    errors.push({
      message: `Unclosed braces: ${openingBraces} opening vs ${closingBraces} closing`,
      line: null
    });
  }
  
  const openingParens = (code.match(/\(/g) || []).length;
  const closingParens = (code.match(/\)/g) || []).length;
  
  if (openingParens !== closingParens) {
    errors.push({
      message: `Unclosed parentheses: ${openingParens} opening vs ${closingParens} closing`,
      line: null
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Basic HTML validation
 * @param {string} code - HTML code to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validateHTML = (code) => {
  const errors = [];
  const tagStack = [];
  const openTagRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  const closeTagRegex = /<\/([a-zA-Z][a-zA-Z0-9]*)>/g;
  const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  
  let match;
  
  // Find opening tags
  while ((match = openTagRegex.exec(code)) !== null) {
    const tagName = match[1].toLowerCase();
    if (!selfClosingTags.includes(tagName)) {
      tagStack.push({ name: tagName, pos: match.index });
    }
  }
  
  // Find closing tags
  while ((match = closeTagRegex.exec(code)) !== null) {
    const tagName = match[1].toLowerCase();
    if (tagStack.length > 0 && tagStack[tagStack.length - 1].name === tagName) {
      tagStack.pop();
    } else {
      errors.push({
        message: `Unexpected closing tag: ${tagName}`,
        line: getLineNumberFromPosition(code, match.index)
      });
    }
  }
  
  // If there are still tags in the stack, they were never closed
  tagStack.forEach(tag => {
    errors.push({
      message: `Unclosed tag: ${tag.name}`,
      line: getLineNumberFromPosition(code, tag.pos)
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Basic CSS validation
 * @param {string} code - CSS code to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validateCSS = (code) => {
  const errors = [];
  
  // Check for unclosed braces
  const openingBraces = (code.match(/\{/g) || []).length;
  const closingBraces = (code.match(/\}/g) || []).length;
  
  if (openingBraces !== closingBraces) {
    errors.push({
      message: `Unclosed braces: ${openingBraces} opening vs ${closingBraces} closing`,
      line: null
    });
  }
  
  // Check for invalid property patterns
  const lines = code.split('\n');
  lines.forEach((line, i) => {
    // Property line without semicolon
    if (line.trim().match(/^\s*[a-z-]+\s*:.+[^;{}\s]$/)) {
      errors.push({
        message: 'Missing semicolon',
        line: i + 1
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extract line number from error message
 * @param {string} message - Error message
 * @returns {number|null} - Line number if found
 */
const extractLineNumber = (message) => {
  const match = message.match(/line\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Get line number from character position
 * @param {string} text - Full text
 * @param {number} position - Character position
 * @returns {number} - Line number (1-based)
 */
const getLineNumberFromPosition = (text, position) => {
  const textBeforePosition = text.substring(0, position);
  return (textBeforePosition.match(/\n/g) || []).length + 1;
};