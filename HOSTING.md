# Hosting: `.htaccess` vs `_headers`

This repo ships **two** optional config files. **Only the stack you deploy to** interprets one of them (or neither). Both stay in the tree so you can switch hosts without losing reference config.

**Mental model:** Apache runs **`.htaccess`** on the origin. Netlify (and a few Netlify-like static hosts) read **`_headers`** at the **publish root**. **GitHub Pages** serves static files only: it does **not** execute `.htaccess` and does **not** apply `_headers` rules—those files are documentation / reuse when the same tree goes elsewhere.

## Quick reference

| Environment | `.htaccess` | `_headers` |
|---------------|-------------|------------|
| **Apache** (shared hosting, LAMP, many VPS panels) | **Used** — Apache reads it when `AllowOverride` allows (rewrite, expires, security headers, WebP rewrite, etc.). | **Not used** — Apache does not read Netlify’s format. |
| **Netlify** (publish this repo root) | **Not used** — Apache config is not interpreted. | **Used** — Netlify merges rules from the **publish directory** root `_headers` file. |
| **GitHub Pages** (Actions deploy from `main`) | **Ignored** — no Apache; file is never executed (can remain for copy-deploy to Apache later). | **Ignored for config** — Pages does not implement `_headers`; rules matter only on a host that supports them (e.g. Netlify) if you deploy the same files there. |

## CDN / reverse proxy

If the site is served behind **Cloudflare**, **Fastly**, or similar, **cache and security headers are often set in the CDN dashboard**, not from these repo files. Treat `.htaccess` / `_headers` as defaults for **origin** or **static hosts that read them**, not as universal edge behavior.

## What to edit when you change host

- **Apache** — maintain **`.htaccess`**; mirror critical rules in CDN UI if you add a CDN.
- **Netlify** — maintain **`_headers`** (and Netlify redirects/UI if used).
- **GitHub Pages only** — neither file changes how Pages serves the site; keep them for other targets and for humans maintaining parity across environments.

## Related

- Deploy flow: `.github/workflows/github-pages.yml`
- Quick deploy checklist: `DEPLOY_NOW.md`
