/**
 * ANALYTICS UTILITY
 * Centralized analytics and event tracking for Ninart Vision
 * 
 * Replace GA_MEASUREMENT_ID with your actual Google Analytics 4 ID
 * Get it from: https://analytics.google.com/
 */

// Track if GA4 is loaded
const GA_LOADED = typeof gtag !== 'undefined';

/**
 * Track custom events
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Event parameters
 */
function trackEvent(eventName, eventParams = {}) {
  if (!GA_LOADED) {
    console.log('[Analytics Debug]', eventName, eventParams);
    return;
  }
  
  try {
    gtag('event', eventName, eventParams);
    console.log('📊 Analytics:', eventName, eventParams);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * Track page views
 * @param {string} pageTitle - Title of the page
 * @param {string} pagePath - Path of the page
 */
function trackPageView(pageTitle, pagePath) {
  if (!GA_LOADED) {
    console.log('[Analytics Debug] Page View:', pageTitle, pagePath);
    return;
  }
  
  try {
    gtag('event', 'page_view', {
      page_title: pageTitle,
      page_path: pagePath
    });
    console.log('📊 Page View:', pageTitle, pagePath);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * Track artist page view
 * @param {string} artistSlug - Artist slug
 * @param {string} artistName - Artist name
 */
function trackArtistView(artistSlug, artistName) {
  trackEvent('artist_view', {
    artist_slug: artistSlug,
    artist_name: artistName,
    event_category: 'Artist',
    event_label: artistName
  });
}

/**
 * Track artwork click
 * @param {string} artworkTitle - Title of the artwork
 * @param {string} artworkId - ID of the artwork (optional)
 * @param {string} artistName - Name of the artist
 */
function trackArtworkClick(artworkTitle, artworkId = null, artistName = null) {
  trackEvent('artwork_click', {
    artwork_title: artworkTitle,
    artwork_id: artworkId || artworkTitle,
    artist_name: artistName,
    event_category: 'Artwork',
    event_label: artworkTitle
  });
}

/**
 * Track WhatsApp contact click
 * @param {string} artistName - Name of the artist
 * @param {string} context - Context of the click (e.g., 'artist_page', 'cart', 'header')
 */
function trackWhatsAppClick(artistName, context = 'unknown') {
  trackEvent('whatsapp_contact', {
    artist_name: artistName,
    contact_context: context,
    event_category: 'Contact',
    event_label: artistName
  });
}

/**
 * Track shop filter usage
 * @param {string} filterType - Type of filter ('artist', 'status')
 * @param {string} filterValue - Value selected
 */
function trackShopFilter(filterType, filterValue) {
  trackEvent('shop_filter', {
    filter_type: filterType,
    filter_value: filterValue,
    event_category: 'Shop',
    event_label: `${filterType}: ${filterValue}`
  });
}

/**
 * Track search actions
 * @param {string} query - Search query
 * @param {string} context - Where the search happened
 */
function trackSearch(query, context = 'unknown') {
  trackEvent('search', {
    search_term: query,
    search_context: context,
    event_category: 'Search',
    event_label: query
  });
}

// Expose functions globally
window.trackEvent = trackEvent;
window.trackPageView = trackPageView;
window.trackArtistView = trackArtistView;
window.trackArtworkClick = trackArtworkClick;
window.trackWhatsAppClick = trackWhatsAppClick;
window.trackShopFilter = trackShopFilter;
window.trackSearch = trackSearch;
