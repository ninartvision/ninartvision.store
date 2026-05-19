/**
 * CMS SETTINGS LOADER  —  js/cms-settings.js
 * ─────────────────────────────────────────────────────────────────
 * Fetches the siteSettings singleton from Sanity and applies its
 * values to the current page.  Covers:
 *   • Social icon links  (Facebook, Instagram, WhatsApp)
 *   • Floating WhatsApp widget button
 *   • Contact email  (mailto: links + .contact-email text nodes)
 *   • Homepage cloth-banner text  (ka + en)
 *   • "Our Mission" heading and paragraph
 *
 * GRACEFUL FALLBACK: If Sanity returns nothing, the page's static
 * HTML remains unchanged.
 *
 * SELF-CONTAINED: does not depend on sanity-queries.js being loaded.
 * Load on any page that contains social links or settings-driven text.
 */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only https: URLs from trusted social hosts (blocks javascript:, data:, etc.). */
function sanitizeSocialHttpsUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:') return '';
      const h = u.hostname.toLowerCase();
      if (
        h === 'facebook.com' ||
        h.endsWith('.facebook.com') ||
        h === 'instagram.com' ||
        h.endsWith('.instagram.com')
      ) {
        return u.href;
      }
    return '';
  } catch {
    return '';
  }
}

function isSafeContactEmail(raw) {
  const s = String(raw ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

(async function cmsSettings() {
  const _API =
    'https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production';

  async function _fetchSettings() {
    const q = `*[_type == "siteSettings"][0]{
      facebookUrl,
      instagramUrl,
      whatsappNumber,
      contactEmail,
      clothBannerKa,
      clothBannerEn,
      missionTitle,
      missionTextEn
    }`;
    try {
      const res = await fetch(`${_API}?query=${encodeURIComponent(q)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.result || null;
    } catch (_) {
      return null;
    }
  }

  const settings = await _fetchSettings();
  if (!settings) return;

  // Make settings available to other scripts on the page
  window.SITE_SETTINGS = settings;

  function applySettings(s) {
    // ── Facebook ────────────────────────────────────────────────
    if (s.facebookUrl) {
      const fb = sanitizeSocialHttpsUrl(s.facebookUrl);
      if (fb) {
        document
          .querySelectorAll('.soc[aria-label="Facebook"]')
          .forEach((el) => (el.href = fb));
      }
    }

    // ── Instagram ───────────────────────────────────────────────
    if (s.instagramUrl) {
      const ig = sanitizeSocialHttpsUrl(s.instagramUrl);
      if (ig) {
        document
          .querySelectorAll('.soc[aria-label="Instagram"]')
          .forEach((el) => (el.href = ig));
      }
    }

    // ── WhatsApp ────────────────────────────────────────────────
    if (s.whatsappNumber) {
      const waUrl = `https://wa.me/${s.whatsappNumber.replace(/\D/g, '')}`;

      // Social icon in nav and mobile menu
      document
        .querySelectorAll('.soc[aria-label="WhatsApp"]')
        .forEach((el) => (el.href = waUrl));

      // Floating widget "Chat on WhatsApp" button
      document
        .querySelectorAll('.wa-btn')
        .forEach((el) => (el.href = waUrl));

      // Floating widget icon link (outer)
      document
        .querySelectorAll('a.wa-float[href^="https://wa.me/"]')
        .forEach((el) => (el.href = waUrl));
    }

    // ── Contact email ───────────────────────────────────────────
    if (s.contactEmail && isSafeContactEmail(s.contactEmail)) {
      const mail = String(s.contactEmail).trim();
      document.querySelectorAll('a[href^="mailto:"]').forEach((el) => {
        el.href = `mailto:${mail}`;
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.textContent.trim())) {
          el.textContent = mail;
        }
      });
      document
        .querySelectorAll('.contact-email')
        .forEach((el) => (el.textContent = mail));
    }

    // ── Homepage cloth banner ───────────────────────────────────
    const bannerKa = document.querySelector('.cloth-banner-text .ka');
    if (bannerKa && s.clothBannerKa && bannerKa.textContent.trim() !== String(s.clothBannerKa).trim()) {
      bannerKa.textContent = s.clothBannerKa;
    }

    const bannerEn = document.querySelector('.cloth-banner-text .en');
    if (bannerEn && s.clothBannerEn && bannerEn.textContent.trim() !== String(s.clothBannerEn).trim()) {
      bannerEn.textContent = s.clothBannerEn;
    }

    // ── Mission section ─────────────────────────────────────────
    if (s.missionTitle) {
      const h2 = document.querySelector('#about .section-top h2');
      if (h2) h2.textContent = s.missionTitle;
    }
    if (s.missionTextEn) {
      const p = document.querySelector('#about .section-top p');
      if (p) {
        const strong = p.querySelector('strong');
        const brandName = strong ? strong.textContent : 'Ninart Vision';
        p.innerHTML = `<strong class="brand-highlight">${escapeHtml(brandName)}</strong> ${escapeHtml(s.missionTextEn)}`;
      }
    }
  }

  // Apply immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applySettings(settings));
  } else {
    applySettings(settings);
  }
})();
