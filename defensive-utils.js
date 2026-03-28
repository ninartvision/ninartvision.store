/**
 * DEFENSIVE RENDERING UTILITIES
 * Production-safe helper functions for DOM manipulation
 */

/**
 * Safely set text content with fallback
 * @param {string|HTMLElement} selector - CSS selector or element
 * @param {string} content - Content to set
 * @param {string} fallback - Fallback if content is empty
 */
function safeSetText(selector, content, fallback = '') {
  const el = typeof selector === 'string' 
    ? document.querySelector(selector) || document.getElementById(selector)
    : selector;
    
  if (!el) {
    console.warn(`[safeSetText] Element not found: ${selector}`);
    return;
  }
  
  el.textContent = content || fallback;
}

/**
 * Safely set HTML content with fallback
 * @param {string|HTMLElement} selector - CSS selector or element
 * @param {string} content - HTML content to set
 * @param {string} fallback - Fallback if content is empty
 */
function safeSetHTML(selector, content, fallback = '') {
  const el = typeof selector === 'string' 
    ? document.querySelector(selector) || document.getElementById(selector)
    : selector;
    
  if (!el) {
    console.warn(`[safeSetHTML] Element not found: ${selector}`);
    return;
  }
  
  el.innerHTML = content || fallback;
}

/**
 * Safely set image source with fallback
 * @param {string|HTMLElement} selector - CSS selector or element
 * @param {string} src - Image URL
 * @param {string} fallback - Fallback image URL
 */
function safeSetImage(selector, src, fallback = 'images/placeholder.jpg') {
  const el = typeof selector === 'string' 
    ? document.querySelector(selector) || document.getElementById(selector)
    : selector;
    
  if (!el) {
    console.warn(`[safeSetImage] Element not found: ${selector}`);
    return;
  }
  
  if (src) {
    el.src = src;
    el.style.display = 'block';
    el.onerror = () => {
      el.src = fallback;
    };
  } else {
    el.src = fallback;
    el.style.display = src ? 'block' : 'none';
  }
}

/**
 * Safely set attribute value
 * @param {string|HTMLElement} selector - CSS selector or element
 * @param {string} attr - Attribute name
 * @param {string} value - Attribute value
 */
function safeSetAttr(selector, attr, value) {
  const el = typeof selector === 'string' 
    ? document.querySelector(selector) || document.getElementById(selector)
    : selector;
    
  if (!el) {
    console.warn(`[safeSetAttr] Element not found: ${selector}`);
    return;
  }
  
  if (value !== null && value !== undefined) {
    el.setAttribute(attr, value);
  }
}

/**
 * Safely get element value with fallback
 * @param {string|HTMLElement} selector - CSS selector or element
 * @param {string} fallback - Fallback if element not found
 * @returns {string}
 */
function safeGetText(selector, fallback = '') {
  const el = typeof selector === 'string' 
    ? document.querySelector(selector) || document.getElementById(selector)
    : selector;
    
  return el?.textContent || fallback;
}

/**
 * Check if array is valid and not empty
 * @param {*} arr - Value to check
 * @returns {boolean}
 */
function isValidArray(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Safely map array with fallback
 * @param {Array} arr - Array to map
 * @param {Function} fn - Map function
 * @param {Array} fallback - Fallback value
 * @returns {Array}
 */
function safeMap(arr, fn, fallback = []) {
  if (!isValidArray(arr)) return fallback;
  return arr.map(fn);
}

/**
 * Safely filter array with fallback
 * @param {Array} arr - Array to filter
 * @param {Function} fn - Filter function
 * @param {Array} fallback - Fallback value
 * @returns {Array}
 */
function safeFilter(arr, fn, fallback = []) {
  if (!isValidArray(arr)) return fallback;
  return arr.filter(fn);
}

/**
 * Safely join array with fallback
 * @param {Array} arr - Array to join
 * @param {string} separator - Join separator
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
function safeJoin(arr, separator = ',', fallback = '') {
  if (!isValidArray(arr)) return fallback;
  return arr.join(separator);
}

/**
 * Format price with currency symbol
 * @param {number|string} price - Price value
 * @param {string} currency - Currency symbol
 * @param {string} fallback - Fallback if price is invalid
 * @returns {string}
 */
function formatPrice(price, currency = '\u20BE', fallback = '') {
  if (!price || price === 0 || price === '0') return fallback;
  return `${currency}${price}`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Show loading state
 * @param {string|HTMLElement} selector - Container selector
 * @param {string} message - Loading message
 */
function showLoading(selector, message = 'Loading...') {
  safeSetHTML(selector, `<p class="muted">${escapeHTML(message)}</p>`);
}

/**
 * Show error state
 * @param {string|HTMLElement} selector - Container selector
 * @param {string} message - Error message
 */
function showError(selector, message = 'Failed to load content.') {
  safeSetHTML(selector, `<p class="muted error">${escapeHTML(message)}</p>`);
}

/**
 * Show empty state
 * @param {string|HTMLElement} selector - Container selector
 * @param {string} message - Empty state message
 */
function showEmpty(selector, message = 'No items found.') {
  safeSetHTML(selector, `<p class="muted">${escapeHTML(message)}</p>`);
}

/**
 * Toggle element visibility
 * @param {string|HTMLElement} selector - Element selector
 * @param {boolean} visible - Whether to show or hide
 */
function toggleVisibility(selector, visible) {
  const el = typeof selector === 'string' 
    ? document.querySelector(selector) || document.getElementById(selector)
    : selector;
    
  if (!el) {
    console.warn(`[toggleVisibility] Element not found: ${selector}`);
    return;
  }
  
  el.style.display = visible ? 'block' : 'none';
}

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidURL(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get query parameter safely
 * @param {string} param - Parameter name
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
function getQueryParam(param, fallback = null) {
  const params = new URLSearchParams(location.search);
  return params.get(param) || fallback;
}

/**
 * Retry async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Initial delay in ms
 * @returns {Promise}
 */
async function retryAsync(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}

// Export for use in modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    safeSetText,
    safeSetHTML,
    safeSetImage,
    safeSetAttr,
    safeGetText,
    isValidArray,
    safeMap,
    safeFilter,
    safeJoin,
    formatPrice,
    escapeHTML,
    showLoading,
    showError,
    showEmpty,
    toggleVisibility,
    debounce,
    isValidURL,
    getQueryParam,
    retryAsync
  };
}
