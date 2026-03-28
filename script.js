document.addEventListener("DOMContentLoaded", () => {

  const fmtPrice = p => {
    const n = Number(String(p || "").replace(/[^\d.]/g, ""));
    return n ? "\u20BE" + n.toLocaleString("en-US") : "";
  };

  /* =========================
     MOBILE MENU
  ========================= */
  const openMenu = document.getElementById("openMenu");
  const closeMenu = document.getElementById("closeMenu");
  const menuOverlay = document.getElementById("menuOverlay");

  if (openMenu && closeMenu && menuOverlay) {
    // Prevent duplicate binding when script is loaded in different page contexts.
    if (!menuOverlay.dataset.menuBound) {
      menuOverlay.dataset.menuBound = "1";

      let lastTouchOpenTs = 0;

      const openMobileMenu = (ev) => {
        ev?.preventDefault();
        ev?.stopPropagation();
        menuOverlay.classList.add("active");
      };

      const closeMobileMenu = (ev) => {
        ev?.preventDefault();
        ev?.stopPropagation();
        menuOverlay.classList.remove("active");
      };

      openMenu.addEventListener("touchend", (ev) => {
        lastTouchOpenTs = Date.now();
        openMobileMenu(ev);
      }, { passive: false });

      openMenu.addEventListener("click", (ev) => {
        // Ignore synthetic click right after touch to avoid instant close race.
        if (Date.now() - lastTouchOpenTs < 400) return;
        openMobileMenu(ev);
      });

      closeMenu.addEventListener("click", closeMobileMenu);
      closeMenu.addEventListener("touchend", closeMobileMenu, { passive: false });

      // Close when clicking on a menu link.
      const menuLinks = menuOverlay.querySelectorAll(".menu-link");
      menuLinks.forEach(link => {
        link.addEventListener("click", () => menuOverlay.classList.remove("active"));
      });

      // Close only when tapping/clicking the backdrop itself.
      menuOverlay.addEventListener("click", (ev) => {
        if (ev.target === menuOverlay) {
          closeMobileMenu(ev);
        }
      });

      // Keep clicks inside menu content from bubbling to backdrop/document handlers.
      menuOverlay.querySelector(".menu-links")?.addEventListener("click", (ev) => {
        ev.stopPropagation();
      });
    }
  }

  /* =========================
     PRODUCT MODAL + GALLERY
  ========================= */
  const modal = document.getElementById("productModal");
  const closeBtn = document.getElementById("productClose");
  const productImg = document.getElementById("productImg");
  const productTitle = document.getElementById("productTitle");
  const productDesc = document.getElementById("productDesc");
  const productSize = document.getElementById("productSize");
  const productMedium = document.getElementById("productMedium");
  const productYear = document.getElementById("productYear");
  const productPrice = document.getElementById("productPrice");

  function ensureStatusEl() {
    if (!productPrice || !productPrice.parentElement) return null;
    let statusEl = document.getElementById("productStatus");
    if (!statusEl) {
      statusEl = document.createElement("p");
      statusEl.id = "productStatus";
      statusEl.className = "status";
      productPrice.insertAdjacentElement("afterend", statusEl);
    }
    return statusEl;
  }

  function setDetailStatus(item) {
    const statusEl = ensureStatusEl();
    if (!statusEl) return;

    const rawStatus = String(item?.dataset?.status || "").toLowerCase().trim();
    const isSoldFlag = String(item?.dataset?.isSold || "").toLowerCase() === "true";
    const isOnSaleFlag = String(item?.dataset?.isOnSale || "").toLowerCase() === "true";

    const isSold = isSoldFlag || rawStatus === "sold";
    const isOnSale = !isSold && (isOnSaleFlag || rawStatus === "sale");

    if (isSold) {
      statusEl.className = "status sold";
      statusEl.textContent = "Sold";
      statusEl.style.display = "block";
      return;
    }

    if (isOnSale) {
      statusEl.className = "status sale";
      statusEl.textContent = "Sale";
      statusEl.style.display = "block";
      return;
    }

    statusEl.className = "status";
    statusEl.textContent = "";
    statusEl.style.display = "none";
  }

  const productThumbs = document.getElementById("productThumbs");
  const galleryPrev = document.getElementById("galleryPrev");
  const galleryNext = document.getElementById("galleryNext");
  const morePhotosBtn = document.getElementById("morePhotosBtn");
  const addToCartBtn = document.getElementById("addToCartBtn");

  let photos = [];
  let index = 0;
  let currentItem = null;

  function showPhoto(i) {
    if (!photos.length) return;
    index = i;
    productImg.src = photos[index];

    if (productThumbs) {
      [...productThumbs.children].forEach(t => t.classList.remove("active"));
      productThumbs.children[index]?.classList.add("active");
    }
  }

  function openModal(item) {
    currentItem = item;
    photos = (item.dataset.photos || "")
      .split(",")
      .map(p => p.trim())
      .filter(Boolean);

    const isSubPage =
      location.pathname.includes("/artists/") ||
      location.pathname.includes("/sale/");

    // Fix image paths: only prepend ../ for local images, not CDN URLs
    if (isSubPage) {
      photos = photos.map(p => {
        // If it's a full URL (from Sanity CDN), use as-is
        if (p.startsWith('http://') || p.startsWith('https://')) {
          return p;
        }
        // For local images, prepend ../
        return "../" + p.toLowerCase();
      });
    } else {
      // On main page, just handle CDN vs local
      photos = photos.map(p => {
        if (p.startsWith('http://') || p.startsWith('https://')) {
          return p;
        }
        return p.toLowerCase();
      });
    }
    
    if (!photos.length) photos = [item.querySelector("img")?.src];

    showPhoto(0);

    productTitle.textContent = item.dataset.title || "";
    productDesc.textContent = item.dataset.desc || "";
    productSize.textContent = item.dataset.size || "";
    productMedium.textContent = item.dataset.medium || "";
    productYear.textContent = item.dataset.year || "";
    productPrice.textContent = fmtPrice(item.dataset.price);
    setDetailStatus(item);

    if (productThumbs) {
      productThumbs.innerHTML = "";
      photos.forEach((src, i) => {
        const img = document.createElement("img");
        img.src = src;
        img.className = "product-thumb";
        img.onclick = () => showPhoto(i);
        productThumbs.appendChild(img);
      });
      productThumbs.style.display = "none";
    }

    modal.classList.add("open");
  }

  // Expose openModal for external use (e.g. delegation handlers)
  window.openProductModal = openModal;

  // Event delegation — one listener per container instead of N per item.
  // Safe to call multiple times; skips containers already delegated.
  window.initShopItems = function() {
    const selectors = [
      '#shopGrid', '#homeShopGrid', '#artistWorksGrid',
      '.shop-grid', '.shop-grid-small', '.home-shop-grid'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(container => {
        if (container.dataset.shopDelegated) return;
        container.dataset.shopDelegated = '1';
        container.addEventListener('click', e => {
          if (e.target.closest('a, button')) return;
          const item = e.target.closest('.shop-item');
          if (!item) return;
          if (typeof trackArtworkClick === 'function') {
            const title = item.dataset.title || 'Unknown';
            const artistId = item.dataset.artist || '';
            const artist = window.CURRENT_ARTIST || window.ARTISTS?.find(a => a.id === artistId);
            trackArtworkClick(title, title, artist?.name || artistId);
          }
          openModal(item);
        });
      });
    });
  };

  // Initial call for static items
  window.initShopItems();

  // Close button with both click and touch support for mobile
  if (closeBtn) {
    const closeModal = (e) => {
      e.preventDefault();
      e.stopPropagation();
      modal.classList.remove("open");
      document.body.style.overflow = '';
    };
    
    closeBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("touchend", closeModal, { passive: false });
  }

  galleryPrev?.addEventListener("click", e => {
    e.stopPropagation();
    showPhoto((index - 1 + photos.length) % photos.length);
  });

  galleryNext?.addEventListener("click", e => {
    e.stopPropagation();
    showPhoto((index + 1) % photos.length);
  });

  morePhotosBtn?.addEventListener("click", e => {
    e.stopPropagation();
    productThumbs.style.display =
      productThumbs.style.display === "flex" ? "none" : "flex";
  });

  addToCartBtn?.addEventListener("click", () => {
    if (!currentItem) return;
    const title = currentItem.dataset.title || "";
    const price = fmtPrice(currentItem.dataset.price);
    const artistId = currentItem.dataset.artist || "";
    // Use current artist from Sanity if available, otherwise fallback to legacy data
    const artist = window.CURRENT_ARTIST || window.ARTISTS?.find(a => a.id === artistId);
    const artistName = artist?.name || "";
    const phone = artist?.whatsapp || "995579388833";

    // Track WhatsApp contact
    if (typeof trackWhatsAppClick === 'function') {
      trackWhatsAppClick(artistName, 'cart');
    }

    const msg = encodeURIComponent(
      `გამარჯობა, მაინტერესებს ნახატი: ${title}, ავტორი ${artistName}, ფასი ${price}`
    );

    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  });

  /* =========================
     MOBILE FULLSCREEN IMAGE VIEWER
  ========================= */
  
  // Create mobile viewer HTML structure dynamically
  function createMobileViewer() {
    if (document.getElementById('mobileImageViewer')) return;
    
    const viewer = document.createElement('div');
    viewer.id = 'mobileImageViewer';
    viewer.className = 'mobile-image-viewer';
    viewer.innerHTML = `
      <div class="mobile-viewer-container">
        <div class="mobile-viewer-top">
          <button class="mobile-viewer-back" id="mobileViewerBack" aria-label="Back">←</button>
          <button class="mobile-viewer-zoom" id="mobileViewerZoom" aria-label="Zoom">🔍</button>
        </div>
        
        <div class="mobile-viewer-image-container">
          <img id="mobileViewerImage" class="mobile-viewer-image" src="" alt="Product image">
          
          <div class="mobile-viewer-arrows">
            <button class="mobile-viewer-arrow" id="mobileViewerPrev" aria-label="Previous">‹</button>
            <button class="mobile-viewer-arrow" id="mobileViewerNext" aria-label="Next">›</button>
          </div>
        </div>
        
        <button class="mobile-viewer-toggle-thumbs" id="mobileToggleThumbs">
          More photos <span class="arrow">↑</span>
        </button>
        
        <div class="mobile-viewer-bottom" id="mobileViewerBottom">
          <div class="mobile-viewer-thumbs" id="mobileViewerThumbs"></div>
        </div>
      </div>
    `;
    document.body.appendChild(viewer);
  }

  // Initialize mobile viewer on mobile devices only
  if (window.innerWidth <= 768) {
    createMobileViewer();
    
    const mobileViewer = document.getElementById('mobileImageViewer');
    const mobileViewerImage = document.getElementById('mobileViewerImage');
    const mobileViewerBack = document.getElementById('mobileViewerBack');
    const mobileViewerZoom = document.getElementById('mobileViewerZoom');
    const mobileViewerPrev = document.getElementById('mobileViewerPrev');
    const mobileViewerNext = document.getElementById('mobileViewerNext');
    const mobileToggleThumbs = document.getElementById('mobileToggleThumbs');
    const mobileViewerBottom = document.getElementById('mobileViewerBottom');
    const mobileViewerThumbs = document.getElementById('mobileViewerThumbs');
    
    let mobileViewerIndex = 0;
    let isZoomed = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let imageX = 0;
    let imageY = 0;
    
    function openMobileViewer(startIndex = 0) {
      if (!photos.length) return;
      mobileViewerIndex = startIndex;
      showMobilePhoto(mobileViewerIndex);
      mobileViewer.classList.add('open');
      document.body.style.overflow = 'hidden';
      
      // Build thumbnails
      mobileViewerThumbs.innerHTML = '';
      photos.forEach((src, i) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = 'mobile-viewer-thumb';
        if (i === mobileViewerIndex) thumb.classList.add('active');
        thumb.onclick = () => {
          showMobilePhoto(i);
          mobileViewerBottom.classList.remove('show');
          mobileToggleThumbs.classList.remove('open');
        };
        mobileViewerThumbs.appendChild(thumb);
      });
      
      // Hide toggle button if only one photo
      if (photos.length <= 1) {
        mobileToggleThumbs.style.display = 'none';
        mobileViewerPrev.style.display = 'none';
        mobileViewerNext.style.display = 'none';
      } else {
        mobileToggleThumbs.style.display = 'flex';
        mobileViewerPrev.style.display = 'flex';
        mobileViewerNext.style.display = 'flex';
      }
    }
    
    function closeMobileViewer() {
      mobileViewer.classList.remove('open');
      document.body.style.overflow = '';
      isZoomed = false;
      mobileViewerImage.classList.remove('zoomed');
      mobileViewerBottom.classList.remove('show');
      mobileToggleThumbs.classList.remove('open');
      mobileViewerImage.style.transform = '';
    }
    
    function showMobilePhoto(i) {
      if (!photos.length) return;
      mobileViewerIndex = i;
      mobileViewerImage.src = photos[mobileViewerIndex];
      isZoomed = false;
      mobileViewerImage.classList.remove('zoomed');
      mobileViewerImage.style.transform = '';
      imageX = 0;
      imageY = 0;
      
      // Update thumbnails
      mobileViewerThumbs.querySelectorAll('.mobile-viewer-thumb').forEach((t, idx) => {
        t.classList.toggle('active', idx === mobileViewerIndex);
      });
    }
    
    // Click on product image to open fullscreen viewer
    productImg?.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileViewer(index);
    });
    
    // Back button - enhanced with touch support
    if (mobileViewerBack) {
      const closeViewer = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMobileViewer();
      };
      mobileViewerBack.addEventListener('click', closeViewer);
      mobileViewerBack.addEventListener('touchend', closeViewer, { passive: false });
    }
    
    // Zoom button - enhanced with touch support
    if (mobileViewerZoom) {
      const toggleZoom = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isZoomed = !isZoomed;
        mobileViewerImage.classList.toggle('zoomed', isZoomed);
        if (!isZoomed) {
          mobileViewerImage.style.transform = '';
          imageX = 0;
          imageY = 0;
        }
      };
      mobileViewerZoom.addEventListener('click', toggleZoom);
      mobileViewerZoom.addEventListener('touchend', toggleZoom, { passive: false });
    }
    
    // Navigation
    mobileViewerPrev?.addEventListener('click', () => {
      showMobilePhoto((mobileViewerIndex - 1 + photos.length) % photos.length);
    });
    
    mobileViewerNext?.addEventListener('click', () => {
      showMobilePhoto((mobileViewerIndex + 1) % photos.length);
    });
    
    // Toggle thumbnails
    mobileToggleThumbs?.addEventListener('click', () => {
      mobileViewerBottom.classList.toggle('show');
      mobileToggleThumbs.classList.toggle('open');
    });
    
    // Touch/drag for zoomed image
    mobileViewerImage?.addEventListener('touchstart', (e) => {
      if (!isZoomed) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });
    
    mobileViewerImage?.addEventListener('touchmove', (e) => {
      if (!isZoomed) return;
      e.preventDefault();
      
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX;
      const deltaY = touchY - touchStartY;
      
      imageX += deltaX;
      imageY += deltaY;
      
      // Limit panning
      const maxX = mobileViewerImage.width * 0.5;
      const maxY = mobileViewerImage.height * 0.5;
      imageX = Math.max(-maxX, Math.min(maxX, imageX));
      imageY = Math.max(-maxY, Math.min(maxY, imageY));
      
      mobileViewerImage.style.transform = `scale(2) translate(${imageX / 2}px, ${imageY / 2}px)`;
      
      touchStartX = touchX;
      touchStartY = touchY;
    });
    
    // Swipe to navigate between images (when not zoomed)
    let swipeStartX = 0;
    
    mobileViewerImage?.addEventListener('touchstart', (e) => {
      if (isZoomed) return;
      swipeStartX = e.touches[0].clientX;
    });
    
    mobileViewerImage?.addEventListener('touchend', (e) => {
      if (isZoomed) return;
      const swipeEndX = e.changedTouches[0].clientX;
      const diff = swipeStartX - swipeEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left - next image
          showMobilePhoto((mobileViewerIndex + 1) % photos.length);
        } else {
          // Swipe right - previous image
          showMobilePhoto((mobileViewerIndex - 1 + photos.length) % photos.length);
        }
      }
    });
  }

  /* =========================
     SHOP FILTER
  ========================= */
  const pills = document.querySelectorAll(".pill");

  function applyFilter(type) {
    pills.forEach(p => p.classList.toggle("active", p.dataset.filter === type));
    document.querySelectorAll(".shop-item").forEach(i => {
      i.classList.toggle('is-hidden', !(type === "all" || i.dataset.status === type));
    });
  }

  pills.forEach(p =>
    p.addEventListener("click", () => applyFilter(p.dataset.filter))
  );

  applyFilter(document.querySelector(".pill.active")?.dataset.filter || "all");

  /* =========================
     HERO SLIDER
  ========================= */
  const slides = document.querySelectorAll(".hero-slides .slide");
  const prev = document.getElementById("prevSlide");
  const next = document.getElementById("nextSlide");
  let slideIndex = 0;

  if (slides.length) {
    function show(i) {
      slides.forEach(s => s.classList.remove("active"));
      slides[i].classList.add("active");
      slideIndex = i;
    }

    prev?.addEventListener("click", () =>
      show((slideIndex - 1 + slides.length) % slides.length)
    );
    next?.addEventListener("click", () =>
      show((slideIndex + 1) % slides.length)
    );
  }

  /* =========================
     FEATURED PROJECTS SLIDER (Responsive)
  ========================= */
  const projectsTrack = document.getElementById("projectsTrack");
  const projectsPrev = document.getElementById("projectsPrev");
  const projectsNext = document.getElementById("projectsNext");

  if (projectsTrack && projectsPrev && projectsNext) {
    let currentIndex = 0;
    const cards = projectsTrack.querySelectorAll(".card");
    const totalCards = cards.length;

    // Touch/swipe support variables
    let touchStartX = 0;
    let touchEndX = 0;

    // Determine how many cards are visible at once
    function getVisibleCards() {
      if (window.innerWidth <= 600) return 3; // Mobile: Show 3 cards
      if (window.innerWidth <= 900) return 2; // Tablet: Show 2 cards
      return 3; // Desktop: Show 3 cards
    }

    // Calculate maximum scroll index
    function getMaxIndex() {
      const visibleCards = getVisibleCards();
      return Math.max(0, totalCards - visibleCards);
    }

    // Update slider position and arrow states
    function updateSlider() {
      const visibleCards = getVisibleCards();
      const cardWidth = cards[0]?.offsetWidth || 0;
      const gap = window.innerWidth <= 600 ? 16 : 22;
      
      // Calculate offset for smooth scrolling
      const offset = currentIndex * (cardWidth + gap);
      projectsTrack.style.transform = `translateX(-${offset}px)`;

      // Update arrow button states (but keep them visible)
      projectsPrev.disabled = currentIndex === 0;
      projectsPrev.style.opacity = currentIndex === 0 ? '0.5' : '1';
      projectsPrev.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
      
      projectsNext.disabled = currentIndex >= getMaxIndex();
      projectsNext.style.opacity = currentIndex >= getMaxIndex() ? '0.5' : '1';
      projectsNext.style.cursor = currentIndex >= getMaxIndex() ? 'not-allowed' : 'pointer';
    }

    // Navigate to previous card
    projectsPrev.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateSlider();
      }
    });

    // Navigate to next card
    projectsNext.addEventListener("click", () => {
      const maxIndex = getMaxIndex();
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateSlider();
      }
    });

    // Touch/swipe support for mobile
    projectsTrack.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    projectsTrack.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentIndex < getMaxIndex()) {
          // Swipe left - go to next
          currentIndex++;
          updateSlider();
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe right - go to previous
          currentIndex--;
          updateSlider();
        }
      }
    }

    // Handle window resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Keep current position but ensure it's within bounds
        const maxIndex = getMaxIndex();
        if (currentIndex > maxIndex) {
          currentIndex = maxIndex;
        }
        updateSlider();
      }, 150);
    });

    // Keyboard navigation (optional enhancement)
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        currentIndex--;
        updateSlider();
      } else if (e.key === "ArrowRight" && currentIndex < getMaxIndex()) {
        currentIndex++;
        updateSlider();
      }
    });

    // Initial setup with slight delay to ensure DOM is ready
    setTimeout(() => {
      updateSlider();
    }, 100);
  } else {
    console.warn('⚠️ Featured Projects Slider elements not found:', {
      track: !!projectsTrack,
      prev: !!projectsPrev,
      next: !!projectsNext
    });
  }

});

/* =========================
   NEWS TOGGLE (SAFE)
========================= */
document.addEventListener("click", e => {
  const item = e.target.closest(".news-item");
  if (!item) return;

  document
    .querySelectorAll(".news-item.open")
    .forEach(n => n !== item && n.classList.remove("open"));

  item.classList.toggle("open");
});

/* =========================
   HOMEPAGE SEARCH
   Filters #homeShopGrid (.shop-item) and #homeArtistsGrid (.artist-card)
   in real-time from existing DOM elements. No backend.
   Debounced + rAF-batched to avoid forced layout on every keystroke.
========================= */
(function () {
  let rafId = null;

  function _doSearch(q, rawVal, shopGrid, artistGrid) {
    // Split into terms so "oil portrait" matches items containing both words
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];

    // --- shop items ---
    if (shopGrid) {
      const items = shopGrid.querySelectorAll('.shop-item');
      let visible = 0;
      items.forEach(item => {
        // Use pre-built searchBlob (title + keywords) when available; build on the fly otherwise
        const blob = item.dataset.searchBlob || [
          item.dataset.title || item.querySelector('.shop-meta span')?.textContent || '',
          item.dataset.keywords || ''
        ].map(s => s.trim()).filter(Boolean).join(' ').toLowerCase();
        const show = !terms.length || terms.every(t => blob.includes(t));
        item.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      let noRes = shopGrid.querySelector('.search-no-results');
      if (!visible && items.length && q) {
        if (!noRes) {
          noRes = document.createElement('p');
          noRes.className = 'muted search-no-results';
          noRes.style.cssText = 'grid-column:1/-1;text-align:center;padding:20px 0';
          shopGrid.appendChild(noRes);
        }
        noRes.textContent = 'No artworks found for "' + rawVal + '"';
      } else if (noRes) {
        noRes.remove();
      }
    }

    // --- artist cards ---
    if (artistGrid) {
      artistGrid.querySelectorAll('.artist-card').forEach(card => {
        const blob = [
          card.querySelector('.artist-name span')?.textContent || card.querySelector('.artist-name')?.textContent || '',
          card.querySelector('.artist-style')?.textContent || '',
          card.dataset.keywords || ''
        ].map(s => s.trim()).filter(Boolean).join(' ').toLowerCase();
        card.classList.toggle('is-hidden', !(!terms.length || terms.every(t => blob.includes(t))));
      });
    }
  }

  function applyHomeSearch() {
    const input = document.getElementById('siteSearch');
    if (!input) return;
    const q = input.value.trim().toLowerCase();
    const rawVal = input.value;
    const shopGrid = document.getElementById('homeShopGrid');
    const artistGrid = document.getElementById('homeArtistsGrid');
    // Batch all DOM writes into a single animation frame
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      _doSearch(q, rawVal, shopGrid, artistGrid);
    });
  }

  // Expose so homeShopPreview.js can re-apply after auto-rotate
  window.applyHomeSearch = applyHomeSearch;

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('siteSearch');
    if (!input) return;
    let debTimer;
    input.addEventListener('input', () => {
      clearTimeout(debTimer);
      debTimer = setTimeout(applyHomeSearch, 120);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        clearTimeout(debTimer);
        input.value = '';
        applyHomeSearch();
        input.blur();
      }
    });
  });
})();

/* =========================
   ADMIN KEYBOARD SHORTCUT
   Ctrl + Shift + A  →  opens /admin.html in a new tab.
   Only you know this shortcut exists.
========================= */
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    const isSubPage =
      location.pathname.includes('/artists/') ||
      location.pathname.includes('/sale/');
    window.open(isSubPage ? '../admin.html' : './admin.html', '_blank');
  }
});
