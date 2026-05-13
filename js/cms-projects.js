/**
 * CMS PROJECTS LOADER  —  js/cms-projects.js
 * ─────────────────────────────────────────────────────────────────
 * Fetches featuredProject documents from Sanity and re-renders the
 * homepage Featured Projects slider (#projectsTrack).
 *
 * ROUTING LOGIC per project card:
 *   • legacyUrl is set  → links to the existing static HTML page
 *     (keeps project1–project7.html working during migration)
 *   • legacyUrl is empty → links to project.html?p={slug}
 *     (new Sanity-managed projects use the dynamic detail template)
 *
 * GRACEFUL FALLBACK: If Sanity returns no projects the seven
 * static card elements coded in index.html remain visible.
 *
 * SLIDER: the slider in script.js uses a cached NodeList so it
 * cannot be re-initialised after a DOM swap.  We reset the track
 * transform to 0 after rendering so the slider starts from card 1.
 *
 * SELF-CONTAINED: does not depend on sanity-queries.js being loaded.
 */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/'/g, '&#39;');
}

/** Project card href: https on ninartvision.store / www, or same-site relative path (no javascript:/data:). */
function sanitizeProjectHref(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (/^(javascript|data|vbscript):/i.test(s) || s.startsWith('//')) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(s)) {
    try {
      const u = new URL(s);
      if (u.protocol !== 'https:') return '';
      const h = u.hostname.toLowerCase();
      if (h !== 'ninartvision.store' && h !== 'www.ninartvision.store') return '';
      return u.href;
    } catch {
      return '';
    }
  }
  if (s.includes(':')) return '';
  return s;
}

function sanitizeSanityImageUrl(u) {
  const s = String(u ?? '').trim();
  if (!/^https:\/\/cdn\.sanity\.io\//i.test(s)) return '';
  return s;
}

(async function cmsProjects() {
  const _API =
    'https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production';

  async function fetchProjects() {
    const q = `*[_type == "featuredProject" && active != false] | order(order asc){
      _id,
      titleKa,
      titleEn,
      "slug": slug.current,
      coverImage{ asset->{ _id, url, metadata{lqip, dimensions} }, alt },
      shortDescEn,
      legacyUrl,
      order
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

  function renderCard(p) {
    const fallbackHref = `project.html?p=${encodeURIComponent(p.slug || p._id)}`;
    let href = p.legacyUrl ? sanitizeProjectHref(p.legacyUrl) : fallbackHref;
    if (!href) href = fallbackHref;

    const rawImg = p.coverImage?.asset?.url;
    const safeImg = rawImg ? sanitizeSanityImageUrl(rawImg) : '';
    const imgBase = './images/placeholder.jpg';
    const imgSrc = safeImg ? `${safeImg}?auto=format&w=800&q=80` : imgBase;
    const imgSrcset = safeImg
      ? `${safeImg}?auto=format&w=400&q=80 400w, ${safeImg}?auto=format&w=800&q=80 800w`
      : '';

    const altRaw = p.coverImage?.alt || p.titleEn || 'Project image';
    const titleEn = p.titleEn || '';
    const titleKa = p.titleKa ? `\u201e${p.titleKa}\u201d` : '';
    const heading = [titleEn, titleKa].filter(Boolean).join(' \u2013 ');
    const desc = p.shortDescEn || '';

    return `<a class="card" href="${escapeAttr(href)}">
  <picture>
    <img src="${escapeAttr(imgSrc)}"${imgSrcset ? ` srcset="${escapeAttr(imgSrcset)}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 360px"` : ''}
         alt="${escapeAttr(altRaw)}" loading="lazy" decoding="async" width="800" height="1000">
  </picture>
  <div class="card-body">
    <h3>${escapeHtml(heading)}</h3>
    ${desc ? `<p class="muted">${escapeHtml(desc)}</p>` : ''}
    <span class="link">Read more →</span>
  </div>
</a>`;
  }

  function renderToTrack(projects) {
    const track = document.getElementById('projectsTrack');
    if (!track) return;

    track.innerHTML = projects.map(renderCard).join('\n');

    // Reset the slider to position 0 after the content swap.
    // The arrows in script.js still work because they read
    // track.querySelectorAll('.card') on every click.
    track.style.transform = 'translateX(0)';

    // Re-apply initial slider state via the existing prev/next buttons
    // by simulating the side-effect of updateSlider(0).
    const prevBtn = document.getElementById('projectsPrev');
    const nextBtn = document.getElementById('projectsNext');
    if (prevBtn) { prevBtn.disabled = true;  prevBtn.style.opacity = '0.5'; }
    if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = '1'; }
  }

  const projects = await fetchProjects();
  if (!projects || !projects.length) return; // keep static fallback

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderToTrack(projects));
  } else {
    renderToTrack(projects);
  }
})();
