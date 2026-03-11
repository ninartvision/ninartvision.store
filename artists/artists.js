document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("artistsGrid");
  const pagination = document.getElementById("pagination");

  const PER_PAGE = 8;
  let page = 1;
  let artists = [];

  if (grid) grid.innerHTML = `<p class="muted">Loading artists...</p>`;

  try {
    artists = await fetchArtistsFromSanity();
  } catch (error) {
    console.error("Error loading artists:", error);
    if (grid) grid.innerHTML = `<p class="muted">Unable to load artists.</p>`;
    return;
  }

  function getArtistLink(artist) {
    const slug = artist.slug?.current || artist.slug || artist._id || "";
    return `artists/artist.html?artist=${encodeURIComponent(slug)}`;
  }

  function render() {
    if (!grid) return;

    if (!artists.length) {
      grid.innerHTML = `<p class="muted">No artists available.</p>`;
      if (pagination) pagination.innerHTML = "";
      return;
    }

    const start = (page - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const items = artists.slice(start, end);

    grid.innerHTML = items.map(artist => {
      const rawUrl =
        artist.image && artist.image.asset && artist.image.asset.url
          ? artist.image.asset.url
          : null;
      const avatarUrl = rawUrl
        ? (typeof window.sanityImgUrl === 'function'
            ? window.sanityImgUrl(rawUrl, { w: 300, h: 300, fit: 'crop', q: 80 })
            : rawUrl)
        : "../images/artists/placeholder.jpg";

      return `
        <a class="artist-card" href="${getArtistLink(artist)}">
          <div class="artist-avatar" style="background-image:url('${avatarUrl}')"></div>
          <h3>${artist.name || ""}</h3>
          ${artist.style ? `<p class="muted">${artist.style}</p>` : ""}
        </a>
      `;
    }).join("");

    renderPagination();
  }

  function renderPagination() {
    if (!pagination) return;

    const totalPages = Math.ceil(artists.length / PER_PAGE);
    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
      const p = i + 1;
      return `<button class="page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`;
    }).join("");

    pagination.querySelectorAll(".page-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        page = Number(btn.dataset.page);
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  render();
});
