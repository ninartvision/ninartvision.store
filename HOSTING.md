# Hosting: `.htaccess` vs `_headers`

This repo ships **two** header/config files. **Only one applies** on a given host. Both stay in the tree so you can move between hosting types without losing reference config.

## Quick reference

| Environment | `.htaccess` | `_headers` |
|---------------|-------------|------------|
| **Apache** (shared hosting, LAMP, many VPS panels) | **Used** — Apache reads it when `AllowOverride` allows (rewrite, expires, security headers, WebP rewrite, etc.). | **Not used** — Apache does not read Netlify’s format. |
| **Netlify** | **Not used** — Apache config is not interpreted. | **Used** — Netlify applies rules from the **publish directory** root `_headers` file. |
| **GitHub Pages** (default static hosting) | **Not used** — Pages does not process `.htaccess` (see comment at top of `.htaccess`). | **Not used by Pages itself** — only relevant if the **same files** are published behind a host that reads `_headers` (e.g. Netlify) or you copy rules elsewhere. |

## CDN / reverse proxy

If the site is served behind **Cloudflare**, **Fastly**, or similar, **cache and security headers are often set in the CDN dashboard**, not from these repo files. Treat `.htaccess` / `_headers` as the defaults for **origin** or **static host** behavior, not as a guarantee for every edge configuration.

## What to edit when you change host

- **Moving to Apache** — rely on **`.htaccess`**; align any CDN rules with what you need there.
- **Moving to Netlify** — rely on **`_headers`** (and Netlify UI redirects if used).
- **Staying on GitHub Pages only** — neither file affects Pages the way Apache/Netlify do; keep them for documentation and future host changes.

## Related

- Deploy flow: `.github/workflows/github-pages.yml`
- Quick deploy checklist: `DEPLOY_NOW.md`
