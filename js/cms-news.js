/**
 * CMS NEWS LOADER  —  js/cms-news.js
 * ─────────────────────────────────────────────────────────────────
 * Fetches newsPost documents from Sanity and renders them into
 * every .news-list container found on the current page.
 *
 * Works on both:
 *   • news.html       — shows all posts
 *   • index.html      — limits to 3 posts (homepage preview)
 *
 * GRACEFUL FALLBACK: If Sanity returns no posts the static HTML
 * articles remain untouched.
 *
 * BILINGUAL: renders both Georgian (.para-ka) and English (.para-en)
 * paragraphs matching the existing HTML structure exactly.
 *
 * NEWS TOGGLE: script.js uses event delegation on `document` so the
 * click-to-expand behaviour works automatically on dynamic articles.
 *
 * SELF-CONTAINED: does not depend on sanity-queries.js being loaded.
 */
(async function cmsNews() {
  const _API =
    'https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production';

  async function fetchPosts() {
    const q = `*[_type == "newsPost"] | order(publishedAt desc){
      _id, titleKa, titleEn, publishedAt, bodyKa, bodyEn
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

  // Format "2026-01-24" → "24/01/2026"
  function fmtDate(str) {
    if (!str) return '';
    try {
      const [y, m, d] = str.split('-');
      return `${d}/${m}/${y}`;
    } catch (_) {
      return str;
    }
  }

  // Convert Sanity portable-text blocks to <p class="para-{lang}"> strings
  function blocksToHtml(blocks, lang) {
    if (!Array.isArray(blocks)) return '';
    return blocks
      .filter((b) => b._type === 'block' && Array.isArray(b.children))
      .map((b) => {
        const html = b.children
          .map((c) => {
            // Escape raw HTML to prevent XSS
            let t = (c.text || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            if (c.marks?.includes('strong')) t = `<strong>${t}</strong>`;
            if (c.marks?.includes('em'))     t = `<em>${t}</em>`;
            return t;
          })
          .join('');
        return `<p class="para-${lang}">${html}</p>`;
      })
      .join('\n');
  }

  function renderPost(post) {
    const kaBody = blocksToHtml(post.bodyKa, 'ka');
    const enBody = blocksToHtml(post.bodyEn, 'en');
    return `<a class="news-item" href="javascript:void(0)">
  <span class="date">${fmtDate(post.publishedAt)}</span>
  <span class="text">
    <span class="news-title">
      ${post.titleKa ? `<span class="title-ka">${post.titleKa}</span>` : ''}
      ${post.titleEn ? `<span class="title-en">${post.titleEn}</span>` : ''}
    </span>
    <span class="news-content">
      ${kaBody}
      ${enBody}
    </span>    <span class="news-related" aria-label="Explore artworks by our artists">
      Browse artists &rarr;
    </span>  </span>
  <span class="arrow">→</span>
</a>`;
  }

  function renderToPage(posts) {
    // On the homepage, cap the news preview at 3 items
    const isHome = !!document.getElementById('homeShopGrid');

    document.querySelectorAll('.news-list').forEach((container) => {
      const show = isHome ? posts.slice(0, 3) : posts;
      if (show.length > 0) {
        container.innerHTML = show.map(renderPost).join('\n');
      }
    });
  }

  const posts = await fetchPosts();
  if (!posts || !posts.length) return; // keep static fallback

  // Inject BlogPosting schema on the dedicated news page only (skip homepage preview)
  const _isNewsPage = !document.getElementById('homeShopGrid');
  if (_isNewsPage && typeof window.injectSchema === 'function') {
    window.injectSchema('article', posts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderToPage(posts));
  } else {
    renderToPage(posts);
  }
})();
