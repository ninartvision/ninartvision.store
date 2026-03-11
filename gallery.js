document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("galleryGrid");

  if (!grid) {
    console.error("❌ galleryGrid not found");
    return;
  }

  /* ---- Sanity image helpers (inline so gallery.html stays self-contained) ---- */
  function sanityImgUrl(url, opts) {
    if (!url || typeof url !== 'string' || !url.includes('cdn.sanity.io')) return url || '';
    opts = opts || {};
    var w = opts.w, h = opts.h, q = opts.q !== undefined ? opts.q : 80;
    var fit = opts.fit || 'max';
    var auto = opts.auto !== false;
    var base = url.split('?')[0];
    var p = new URLSearchParams();
    if (auto) p.set('auto', 'format');
    if (w) p.set('w', String(w));
    if (h) p.set('h', String(h));
    p.set('q', String(q));
    if ((w || h) && fit !== 'max') p.set('fit', fit);
    return base + '?' + p.toString();
  }
  function sanitySrcset(url, widths, opts) {
    if (!url || !url.includes('cdn.sanity.io')) return '';
    widths = widths || [400, 800, 1200];
    opts = opts || {};
    return widths.map(function(w) {
      return sanityImgUrl(url, Object.assign({}, opts, { w: w })) + ' ' + w + 'w';
    }).join(', ');
  }

  grid.innerHTML = "<p class='muted'>Loading artworks...</p>";

  try {
  const query = `
  *[_type == "artwork" && defined(image)]
  | order(order asc, _createdAt desc) {
    _id,
    title,
    "img": image.asset->url,
    "photos": images[].asset->url,
    medium,
    "size": dimensions,
    price,
    status,
    order,
    description,
    "slug": slug.current,
    featured,
    "artist": artist->{
      _id,
      name,
      "slug": slug.current
    }
  }
`;


    const res = await fetch(
      "https://8t5h923j.apicdn.sanity.io/v2026-02-01/data/query/production?query=" +
        encodeURIComponent(query)
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const { result: artworks } = await res.json();

    if (!artworks.length) {
      grid.innerHTML = "<p class='muted'>No artworks found.</p>";
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

      card.innerHTML = `
        <img class="thumb-img"
          src="${sanityImgUrl(art.img, {w: 600, q: 80})}"
          srcset="${sanitySrcset(art.img, [400, 600, 800])}"
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 400px"
          alt="${art.title}"
          loading="lazy"
          decoding="async"
          width="600" height="450" />

        <div class="card-body">
          <h3>${art.title}</h3>

          <p class="muted">
            ${art.medium || ""}${art.size ? " | " + art.size : ""}
          </p>

          <div class="card-row">
            <span class="price">₾${art.price || ""}</span>

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
                        art.title
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
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p class='muted'>Failed to load artworks.</p>";
  }
});
