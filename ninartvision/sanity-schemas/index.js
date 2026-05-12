/**
 * SANITY SCHEMA INDEX
 * ─────────────────────────────────────────────────────────────────
 * Add these four lines to your Sanity Studio's schemaTypes/index.js
 * (or schemas/index.js) to register the new content types.
 *
 * The existing artist and artwork types stay exactly as they are.
 */

// New types — copy/import into your Studio's schema list:
export { default as siteSettings  } from './siteSettings.js';
export { default as heroSlide     } from './heroSlide.js';
export { default as newsPost      } from './newsPost.js';
export { default as featuredProject } from './featuredProject.js';
