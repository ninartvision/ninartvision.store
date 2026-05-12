function observeHomeArtistReveal(grid) {
  const cards = grid.querySelectorAll(".artist-card");
  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!cards.length) return;
  if (reduced || !("IntersectionObserver" in window)) {
    cards.forEach(function (c) {
      c.classList.add("artist-card--visible");
    });
    return;
  }
  const io = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const idx = Number(el.dataset.revealIdx || 0);
        el.style.transitionDelay = Math.min(idx * 70, 280) + "ms";
        el.classList.add("artist-card--visible");
        obs.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  cards.forEach(function (el, i) {
    el.dataset.revealIdx = String(i);
    io.observe(el);
  });
}

async function initHomeArtistsPreview() {
  const grid = document.getElementById("homeArtistsGrid");
  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading artists...</p>`;

  try {
    const artists = await fetchArtistsFromSanity(3);

    if (!artists || !artists.length) {
      grid.innerHTML = `<p class="muted">No artists available.</p>`;
      return;
    }

    grid.innerHTML = artists
      .map((artist) => {
        const slug = artist.slug || artist._id;

        const avatarRaw = artist.image?.asset?.url || null;
        const avatar = avatarRaw
          ? typeof window.sanityImgUrl === "function"
            ? window.sanityImgUrl(avatarRaw, {
                w: 560,
                h: 700,
                fit: "crop",
                q: 82,
              })
            : avatarRaw
          : "images/artists/placeholder.jpg";

        return `
        <a class="artist-card"
           href="artists/artist.html?artist=${encodeURIComponent(slug)}">

          <div class="artist-showcase-media">
            <div class="artist-avatar"
                 style="background-image:url('${avatar}')"></div>
          </div>

          <h3 class="artist-name">
            <img src="images/icon.jpg" class="flag-icon" alt="">
            <span>${artist.name}</span>
          </h3>

          ${artist.style ? `<p class="artist-style">${artist.style}</p>` : ""}
        </a>
      `;
      })
      .join("");

    observeHomeArtistReveal(grid);
  } catch (err) {
    console.error("Failed to load artists on home page", err);
    grid.innerHTML = `<p class="muted">Failed to load artists.</p>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeArtistsPreview);
} else {
  initHomeArtistsPreview();
}
