const fmtPrice = p => { const n = Number(String(p || '').replace(/[^\d.]/g, '')); return n ? '\u20BE' + n.toLocaleString('en-US') : ''; };

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

document.addEventListener("DOMContentLoaded", async () => {
  var params = new URLSearchParams(window.location.search);
  var artworkSlug = params.get('artwork');
  if (artworkSlug) {
    window.location.replace('./products/' + encodeURIComponent(artworkSlug.trim()) + '/');
    return;
  }

  const grid = document.getElementById("galleryGrid");

  if (!grid) {
    console.error("❌ galleryGrid not found");
    return;
  }

  // Guard: sanity-client.js must be loaded before gallery.js
  if (!window.sanityImgUrl || !window.fetchAllArtworks) {
    console.error('❌ sanity-client.js not loaded — gallery.js requires it');
    grid.innerHTML = "<p class='muted'>Failed to load artworks.</p>";
    return;
  }

  // Show skeleton cards while data loads (nvSkeleton from sanity-client.js)
  if (window.nvSkeleton) {
    window.nvSkeleton(grid, 8);
  } else {
    grid.innerHTML = "<p class='muted'>Loading artworks…</p>";
  }

  try {
    const artworks = await window.fetchAllArtworks();

    if (!artworks || !artworks.length) {
      window.nvEmpty
        ? window.nvEmpty(grid, 'No artworks available')
        : (grid.innerHTML = "<p class='muted'>No artworks found.</p>");
      return;
    }

    grid.innerHTML = "";

    // Stable sort: sold last, order asc, fallback _createdAt desc
    const sortedArtworks = artworks.slice().sort((a, b) => {
      // Sold always last
      const aSold = (a.status || "").toLowerCase().trim() === "sold";
      const bSold = (b.status || "").toLowerCase().trim() === "sold";
      if (aSold !== bSold) return aSold ? 1 : -1;
      // If both unsold or both sold, use order field if present
      if (typeof a.order === "number" && typeof b.order === "number") {
        return a.order - b.order;
      }
      // Fallback to _createdAt (desc)
      if (a._createdAt && b._createdAt) {
        return new Date(b._createdAt) - new Date(a._createdAt);
      }
      return 0;
    });

    sortedArtworks.forEach((art) => {
      const isSold = (art.status || "").toLowerCase().trim() === "sold";

      const card = document.createElement("article");
      card.className = "card";

      const thumbSrc = window.sanityImgUrl(art.img, {w: 600, q: 80});
      const thumbSrcset = window.sanitySrcset(art.img, [400, 600, 800]);
      const slugEnc = encodeURIComponent(art.artist.slug || '');
      const artistName = art.artist.name || 'artist';

      card.innerHTML = `
        <div class="nv-img-wrap"${art.lqip ? ` style="background-image:url(${escapeAttr(art.lqip)})"` : ''}>
          <img class="thumb-img nv-lqip"
            src="${escapeAttr(thumbSrc)}"
            srcset="${escapeAttr(thumbSrcset)}"
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 400px"
            alt="${escapeAttr(art.title)}"
            loading="lazy"
            decoding="async"
            width="600" height="450"
            onload="this.classList.add('nv-loaded');this.parentNode.style.backgroundImage=''"
            onerror="this.classList.add('nv-loaded');this.parentNode.style.backgroundImage='';this.src='./images/placeholder.jpg'" />
        </div>

        <div class="card-body">
          <h3>${escapeHtml(art.title)}</h3>

          ${art.artist && art.artist.slug
            ? `<a class="artist-credit" href="./artists/artist.html?artist=${slugEnc}" aria-label="View artworks by ${escapeAttr(artistName)}">${escapeHtml(art.artist.name || '')}</a>`
            : ''}

          <p class="muted">
            ${escapeHtml(art.medium || "")}${art.size ? " | " + escapeHtml(art.size) : ""}
          </p>

          <div class="card-row">
            <span class="price">${fmtPrice(art.price)}</span>

            <div class="buy-row">
              ${
                isSold
                  ? `<span class="sold-badge">SOLD</span>`
                  : `
                    <a class="buy insta"
                      href="https://instagram.com/ninart.vision"
                      target="_blank">Instagram</a>

                    <a class="buy"
                      href="https://wa.me/995579388833?text=Hello, I'm interested in ${encodeURIComponent(
                        art.title || ''
                      )}"
                      target="_blank">WhatsApp</a>
                  `
              }
            </div>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Inject VisualArtwork schema for the primary (first available) artwork
    var _schemaArt = sortedArtworks.find(function(a) {
      return (a.status || '').toLowerCase() !== 'sold';
    }) || sortedArtworks[0];
    if (_schemaArt && typeof window.injectSchema === 'function') {
      window.injectSchema('artwork', _schemaArt);
    }
  } catch (err) {
    console.error(err);
    window.nvError
      ? window.nvError(grid, 'Could not load artworks. Please try again.', function() { location.reload(); })
      : (grid.innerHTML = "<p class='muted'>Failed to load artworks.</p>");
  }
});
