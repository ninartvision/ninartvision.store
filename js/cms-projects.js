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
    // Prefer legacy URL so existing bookmarks /  project1-7 links keep working;
    // fall back to the dynamic template for new Sanity-only projects.
    const href = p.legacyUrl
      ? p.legacyUrl
      : `project.html?p=${encodeURIComponent(p.slug || p._id)}`;

    const imgUrl = p.coverImage?.asset?.url;
    const imgBase = imgUrl || './images/placeholder.jpg';
    const imgSrc    = imgUrl ? `${imgUrl}?auto=format&w=800&q=80` : imgBase;
    const imgSrcset = imgUrl
      ? `${imgUrl}?auto=format&w=400&q=80 400w, ${imgUrl}?auto=format&w=800&q=80 800w`
      : '';

    const alt   = p.coverImage?.alt || p.titleEn || 'Project image';
    // Combine both title languages the same way the static cards do
    const titleEn = p.titleEn || '';
    const titleKa = p.titleKa ? `„${p.titleKa}"` : '';
    const heading = [titleEn, titleKa].filter(Boolean).join(' – ');
    const desc    = p.shortDescEn || '';

    return `<a class="card" href="${href}">
  <picture>
    <img src="${imgSrc}"${imgSrcset ? ` srcset="${imgSrcset}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 360px"` : ''}
         alt="${alt}" loading="lazy" decoding="async" width="800" height="1000">
  </picture>
  <div class="card-body">
    <h3>${heading}</h3>
    ${desc ? `<p class="muted">${desc}</p>` : ''}
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
