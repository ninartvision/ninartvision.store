async function initHomeArtistsPreview() {
  console.log('[homeArtistsPreview] init — readyState:', document.readyState);
  const grid = document.getElementById("homeArtistsGrid");
  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading artists...</p>`;

  try {
    // 🔑 Sanity-დან წამოვიღოთ 3 არტისტი
    const artists = await fetchArtistsFromSanity(3);

    console.log('[homeArtistsPreview] data loaded —', (artists || []).length, 'artists');
    if (artists && artists.length > 0) {
      console.log('[homeArtistsPreview] sample artist:', JSON.stringify({
        _id: artists[0]._id,
        name: artists[0].name,
        slug: artists[0].slug,
        hasImage: !!(artists[0].image?.asset?.url),
        style: artists[0].style
      }));
    }

    if (!artists || !artists.length) {
      grid.innerHTML = `<p class="muted">No artists available.</p>`;
      return;
    }

    console.log('[homeArtistsPreview] render artists');
    grid.innerHTML = artists.map(artist => {
      const slug = artist.slug || artist._id;

      const avatarRaw = artist.image?.asset?.url || null;
      const avatar = avatarRaw
        ? (typeof window.sanityImgUrl === 'function'
            ? window.sanityImgUrl(avatarRaw, { w: 300, h: 300, fit: 'crop', q: 80 })
            : avatarRaw)
        : "images/artists/placeholder.jpg";

      return `
        <a class="artist-card"
           href="artists/artist.html?artist=${encodeURIComponent(slug)}">

          <div class="artist-avatar"
               style="background-image:url('${avatar}')"></div>

          <h3 class="artist-name">
            <img src="images/icon.jpg" class="flag-icon" alt="">
            <span>${artist.name}</span>
          </h3>

          ${artist.style ? `<p class="artist-style">${artist.style}</p>` : ""}
        </a>
      `;
    }).join("");

  } catch (err) {
    console.error("❌ Failed to load artists on home page", err);
    grid.innerHTML = `<p class="muted">Failed to load artists.</p>`;
  }
}

// Same readyState guard — idle-loaded scripts must not rely on DOMContentLoaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeArtistsPreview);
} else {
  initHomeArtistsPreview();
}
