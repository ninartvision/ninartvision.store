import { defineType, defineField } from 'sanity';

/**
 * SITE SETTINGS  (Singleton — one document controls the whole site)
 * ─────────────────────────────────────────────────────────────────
 * After deploying, create exactly ONE document of this type in
 * Sanity Studio and always edit that same document.
 *
 * Controlled by this schema:
 *   • Social links  (Facebook, Instagram, WhatsApp)
 *   • Contact email
 *   • Homepage cloth-banner text  (ka + en)
 *   • "Our Mission" section copy
 */
export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: () => '⚙️',

  fieldsets: [
    { name: 'social',   title: 'Social & Contact' },
    { name: 'homepage', title: 'Homepage Content' },
    { name: 'mission',  title: 'Mission Section' },
  ],

  fields: [
    // ── Social & Contact ───────────────────────────────────────────
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      fieldset: 'social',
      description: 'Full Facebook page URL — e.g. https://www.facebook.com/your-page',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      fieldset: 'social',
      description: 'Full Instagram profile URL',
    }),
    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      fieldset: 'social',
      description:
        'Digits only, with country code, no + or spaces.  Example: 995579388833',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      fieldset: 'social',
      description: 'Displayed in the Support page and all mailto: links.',
    }),

    // ── Homepage Content ───────────────────────────────────────────
    defineField({
      name: 'clothBannerKa',
      title: 'Homepage Banner Text (Georgian)',
      type: 'string',
      fieldset: 'homepage',
      description:
        'The welcoming phrase shown in the banner strip below the hero.',
    }),
    defineField({
      name: 'clothBannerEn',
      title: 'Homepage Banner Text (English)',
      type: 'text',
      rows: 2,
      fieldset: 'homepage',
    }),

    // ── Mission Section ────────────────────────────────────────────
    defineField({
      name: 'missionTitle',
      title: 'Mission Section Heading',
      type: 'string',
      fieldset: 'mission',
      initialValue: 'Our Mission',
    }),
    defineField({
      name: 'missionTextEn',
      title: 'Mission Text (English)',
      type: 'text',
      rows: 4,
      fieldset: 'mission',
      description:
        'The paragraph shown below the heading. Appears after the bold brand name.',
    }),
  ],

  preview: {
    prepare: () => ({ title: 'Site Settings', subtitle: 'Global configuration' }),
  },
});
