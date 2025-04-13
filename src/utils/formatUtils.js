/**
 * Utility functions for formatting various data types
 */

/**
 * Format a date in a human-readable way
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions = {
    relative: false,
    includeTime: false,
    ...options
  };
  
  if (defaultOptions.relative) {
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(defaultOptions.includeTime && { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
  });
  
  return formatter.format(dateObj);
};

/**
 * Format a file size in a human-readable way
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Truncate a string if it exceeds a certain length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated string
 */
export const truncateString = (str, maxLength = 30) => {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

/**
 * Format code based on language
 * @param {string} code - Code to format
 * @param {string} language - Programming language
 * @returns {string} - Formatted code
 */
export const formatCode = (code, language) => {
  // Simple formatters for demo purposes
  // In a real app, you would use a proper formatter like Prettier
  
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      return formatJavaScript(code);
    case 'html':
      return formatHTML(code);
    case 'css':
      return formatCSS(code);
    default:
      return code;
  }
};

/**
 * Basic JavaScript formatter
 * @param {string} code - JavaScript code to format
 * @returns {string} - Formatted JavaScript code
 */
const formatJavaScript = (code) => {
  // This is a very basic formatter for demonstration
  // For production use a proper library like Prettier
  
  // Add semicolons where missing
  let formatted = code.replace(/([^;])\n/g, '$1;\n');
  
  // Fix indentation
  const lines = formatted.split('\n');
  let indentLevel = 0;
  
  formatted = lines.map(line => {
    // Decrease indent for closing braces/brackets
    if (line.trim().startsWith('}') || line.trim().startsWith(']')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indentedLine = '  '.repeat(indentLevel) + line.trim();
    
    // Increase indent for opening braces/brackets
    if (line.includes('{') || line.includes('[')) {
      indentLevel += 1;
    }
    
    return indentedLine;
  }).join('\n');
  
  return formatted;
};

/**
 * Basic HTML formatter
 * @param {string} code - HTML code to format
 * @returns {string} - Formatted HTML code
 */
const formatHTML = (code) => {
  // Very basic HTML formatter for demonstration
  let formatted = '';
  let indentLevel = 0;
  let inTag = false;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    
    if (char === '<' && code[i + 1] !== '/') {
      if (i > 0) formatted += '\n';
      formatted += '  '.repeat(indentLevel) + char;
      indentLevel += 1;
      inTag = true;
    } else if (char === '<' && code[i + 1] === '/') {
      indentLevel -= 1;
      if (!inTag) formatted += '\n' + '  '.repeat(indentLevel);
      formatted += char;
      inTag = true;
    } else if (char === '>') {
      formatted += char;
      inTag = false;
    } else {
      formatted += char;
    }
  }
  
  return formatted;
};

/**
 * Basic CSS formatter
 * @param {string} code - CSS code to format
 * @returns {string} - Formatted CSS code
 */
const formatCSS = (code) => {
  // Very basic CSS formatter for demonstration
  let formatted = '';
  let inSelector = true;
  let indentLevel = 0;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    
    if (char === '{') {
      formatted += ' ' + char;
      formatted += '\n' + '  '.repeat(indentLevel + 1);
      inSelector = false;
    } else if (char === '}') {
      formatted += '\n' + '  '.repeat(indentLevel) + char + '\n';
      inSelector = true;
    } else if (char === ';' && !inSelector) {
      formatted += char;
      formatted += '\n' + '  '.repeat(indentLevel + 1);
    } else if (char === '\n') {
      if (inSelector) formatted += '\n';
    } else {
      formatted += char;
    }
  }
  
  return formatted;
};