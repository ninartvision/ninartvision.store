(async function () {
  /* ---------------------------
     GET ARTIST SLUG
  --------------------------- */
  const params = new URLSearchParams(location.search)
  const artistSlug = params.get('artist')

  if (!artistSlug) {
    console.error('No artist slug in URL')
    return
  }

  const grid = document.getElementById('shopGrid')

  /* ---------------------------
     FETCH ARTIST FROM SANITY
  --------------------------- */
  async function fetchArtist() {
    const query = `
      *[_type == "artist" && slug.current == "${artistSlug}"][0]{
        _id,
        name,
        "slug": slug.current,
        shortDescription,
        subtitle,
        image{
          asset->{
            _id,
            url,
            metadata{lqip, dimensions}
          },
          alt
        },
        gallery[]{
          asset->{
            _id,
            url,
            metadata{lqip, dimensions}
          },
          alt,
          _key
        },
        bio,
        style,
        status,
        featured,
        seoTitle,
        seoDescription
      }
    `

    const res = await fetch(
      'https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production?query=' +
        encodeURIComponent(query)
    )

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const { result } = await res.json()
    return result
  }

  /* ---------------------------
     FETCH ARTWORKS FROM SANITY
  --------------------------- */
  async function fetchArtworks() {
    const query = `
      *[_type == "artwork" && artist->slug.current == "${artistSlug}" && (!defined(status) || status in ["published", "sold"])] | order(_createdAt desc){
        _id,
        title,
        "slug": slug.current,
        shortDescription,
        image{
          asset->{
            _id,
            url,
            metadata{lqip, dimensions}
          },
          alt
        },
        images[]{
          asset->{
            _id,
            url,
            metadata{lqip, dimensions}
          },
          alt,
          _key
        },
        year,
        medium,
        "size": dimensions,
        category,
        "desc": description,
        price,
        status,
        featured
      }
    `

    const res = await fetch(
      'https://8t5h923j.apicdn.sanity.io/v2025-02-05/data/query/production?query=' +
        encodeURIComponent(query)
    )

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const { result } = await res.json()
    return result || []
  }

  /* ---------------------------
     UPDATE SEO META TAGS
  --------------------------- */
  function updateSEOTags(artist) {
    if (!artist) return

    const pageTitle = artist.seoTitle || `${artist.name} | Ninart Vision`
    const pageDesc = artist.seoDescription || artist.shortDescription || `Discover artworks by ${artist.name}, a contemporary Georgian artist.`
    const ogImageUrl = artist.image?.asset?.url || ''

    // Update title
    document.title = pageTitle
    const titleTag = document.getElementById('pageTitle')
    if (titleTag) titleTag.setAttribute('content', pageTitle)

    // Update meta description
    const descTag = document.getElementById('pageDescription')
    if (descTag) descTag.setAttribute('content', pageDesc)

    // Update Open Graph
    const ogTitle = document.getElementById('ogTitle')
    const ogDesc = document.getElementById('ogDescription')
    const ogImage = document.getElementById('ogImage')
    const ogUrl = document.getElementById('ogUrl')

    if (ogTitle) ogTitle.setAttribute('content', pageTitle)
    if (ogDesc) ogDesc.setAttribute('content', pageDesc)
    if (ogImage && ogImageUrl) ogImage.setAttribute('content', ogImageUrl)
    if (ogUrl) ogUrl.setAttribute('content', window.location.href)

    // Update Twitter Card
    const twitterTitle = document.getElementById('twitterTitle')
    const twitterDesc = document.getElementById('twitterDescription')
    const twitterImage = document.getElementById('twitterImage')

    if (twitterTitle) twitterTitle.setAttribute('content', pageTitle)
    if (twitterDesc) twitterDesc.setAttribute('content', pageDesc)
    if (twitterImage && ogImageUrl) twitterImage.setAttribute('content', ogImageUrl)
  }

  /* ---------------------------
     RENDER ARTIST GALLERY
  --------------------------- */
  function renderArtistGallery(gallery) {
    // Check if gallery container exists, if not create it
    let galleryContainer = document.getElementById('artistGallery')
    
    if (!galleryContainer) {
      // Insert gallery after the artist header, before the filter tabs
      const artistHeader = document.querySelector('.artist-header')
      const filterTabs = document.querySelector('.filter-tabs')
      
      galleryContainer = document.createElement('div')
      galleryContainer.id = 'artistGallery'
      galleryContainer.className = 'artist-gallery'
      
      if (artistHeader && filterTabs) {
        artistHeader.parentNode.insertBefore(galleryContainer, filterTabs)
      }
    }
    
    if (!galleryContainer) return
    
    // Render gallery images
    const iUrl = typeof window.sanityImgUrl === 'function' ? window.sanityImgUrl : u => u
    const iSet = typeof window.sanitySrcset === 'function' ? window.sanitySrcset : () => ''
    const galleryHTML = gallery.map((img, index) => {
      const rawUrl = img.asset?.url || ''
      const src = iUrl(rawUrl, { w: 800, q: 80 })
      const srcset = iSet(rawUrl, [400, 700, 1000])
      return `
      <div class="gallery-item" data-index="${index}">
        <img
          src="${src}"
          ${srcset ? `srcset="${srcset}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 450px"` : ''}
          alt="${img.alt || 'Artist gallery image'}"
          loading="lazy"
          decoding="async"
          width="800" height="600"
          onerror="this.src='../images/placeholder.jpg'"
        >
      </div>
    `}).join('')
    
    galleryContainer.innerHTML = `
      <h3 class="gallery-title">Gallery</h3>
      <div class="gallery-grid">
        ${galleryHTML}
      </div>
    `
  }

  /* ---------------------------
     RENDER BIO TEXT
  --------------------------- */
  function renderBio(artist) {
    const aboutTextEl = document.getElementById('aboutText')
    if (!aboutTextEl) return

    // Use the new unified bio field
    const bioText = artist.bio || artist.shortDescription || 'Biography not available.'
    aboutTextEl.textContent = bioText
  }

  /* ---------------------------
     RENDER ARTWORKS
  --------------------------- */
  function renderArtworks(artworks) {
    if (!grid) return

    if (!artworks.length) {
      grid.innerHTML = `<p class="muted">No artworks found.</p>`
      return
    }

    grid.innerHTML = artworks
      .map(
        (a) => {
          const iUrl = typeof window.sanityImgUrl === 'function' ? window.sanityImgUrl : u => u
          const iSet = typeof window.sanitySrcset === 'function' ? window.sanitySrcset : () => ''

          // Thumbnail at 600px; lightbox photos at 1200px
          const rawUrl = a.image?.asset?.url || null
          const imgUrl = rawUrl ? iUrl(rawUrl, { w: 600, q: 80 }) : '../images/placeholder.jpg'
          const imgSrcset = rawUrl ? iSet(rawUrl, [400, 600, 800]) : ''

          // Get all photos at 1200px for the lightbox
          const allPhotos = a.images && a.images.length > 0
            ? a.images.map(img => img.asset?.url).filter(Boolean).map(u => iUrl(u, { w: 1200, q: 85 }))
            : (rawUrl ? [iUrl(rawUrl, { w: 1200, q: 85 })] : ['../images/placeholder.jpg'])
          
          return `
      <div class="shop-item ${a.status === 'sold' ? 'sold' : 'sale'}"
        data-status="${a.status}"
        data-title="${a.title || 'Untitled'}"
        data-price="${a.price || ''}"
        data-size="${a.size || ''}"
        data-medium="${a.medium || ''}"
        data-year="${a.year || ''}"
        data-desc="${a.desc || a.shortDescription || ''}"
        data-photos="${allPhotos.join(',')}">  

        <img src="${imgUrl}"
             ${imgSrcset ? `srcset="${imgSrcset}" sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 300px"` : ''}
             alt="${a.image?.alt || a.title || 'Artwork'}" 
             loading="lazy"
             decoding="async"
             width="600" height="750">
        <div class="shop-meta">
          <span>${a.title || 'Untitled'}</span>
          ${a.price ? `<span class="price">₾${a.price}</span>` : ''}
        </div>
      </div>
    `
        }
      )
      .join('')

    if (window.initShopItems) window.initShopItems()
  }

  /* ---------------------------
     INIT PAGE
  --------------------------- */
  try {
    const artist = await fetchArtist()
    const artworks = await fetchArtworks()

    if (artist) {
      // Update artist header
      const nameEl = document.querySelector('.artist-name')
      const avatarEl = document.getElementById('artistAvatar')
const statusEl = document.querySelector('.artist-status')

if (statusEl) {
  statusEl.textContent =
    artist.status ||
    artist.subtitle ||
    artist.style ||
    ''
  
  statusEl.style.display = statusEl.textContent.trim()
    ? 'block'
    : 'none'
}

      if (nameEl) nameEl.textContent = artist.name || 'Artist'
      
      // Handle new image structure
      if (avatarEl && artist.image?.asset?.url) {
        const rawAvatarUrl = artist.image.asset.url
        avatarEl.src = typeof window.sanityImgUrl === 'function'
          ? window.sanityImgUrl(rawAvatarUrl, { w: 800, q: 80 })
          : rawAvatarUrl
        avatarEl.alt = artist.image.alt || artist.name || 'Artist Avatar'
        avatarEl.style.display = 'block'
      } else if (avatarEl) {
        avatarEl.style.display = 'none'
      }

      // Render gallery if it exists
      if (artist.gallery && artist.gallery.length > 0) {
        renderArtistGallery(artist.gallery)
      }

      // Render bio
      renderBio(artist)

      // Update SEO meta tags
      updateSEOTags(artist)

      // Store globally for compatibility
      window.CURRENT_ARTIST = artist
    }

    renderArtworks(artworks)
  } catch (err) {
    console.error('❌ Artist page error:', err)
    if (grid) grid.innerHTML = `<p class="muted">Failed to load content.</p>`
  }
})()
