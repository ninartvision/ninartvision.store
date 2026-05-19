/**
 * Convert any string to a URL-safe slug.
 * "Pomegranate Emotion" → "pomegranate-emotion"
 * '"My Artwork"'        → "my-artwork"
 */
function generateSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['"«»""''„"]/g, '')       // remove all quote variants
    .replace(/[^\w\s-]/g, '')            // remove non-word chars except spaces/hyphens
    .trim()
    .replace(/\s+/g, '-')               // spaces → hyphens
    .replace(/-+/g, '-');               // collapse multiple hyphens
}
window.generateSlug = generateSlug;

/**
 * Update OG / Twitter meta tags in <head> dynamically.
 * Called when a product modal opens so that if a user copies the
 * product URL from the address bar the tags are already set correctly.
 */
function updateOgTags({ title, description, imageUrl, pageUrl }) {
  const setMeta = (attr, val, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${val}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, val);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
  if (title) {
    document.title = title + ' | Ninart Vision';
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
  }
  if (description) {
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:description', description);
  }
  if (imageUrl) {
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('name', 'twitter:image', imageUrl);
  }
  if (pageUrl) {
    setMeta('property', 'og:url', pageUrl);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const NV_CART_STORAGE_KEY = "nv_cart_inquiries";

  function nvReadCartCount() {
    try {
      const n = parseInt(localStorage.getItem(NV_CART_STORAGE_KEY) || "0", 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  }

  function nvSyncCartBadges() {
    const count = nvReadCartCount();
    const label =
      count === 0 ? "" : `${count} ${count === 1 ? "item" : "items"} in inquiry cart`;
    document.querySelectorAll("[data-cart-badge]").forEach(el => {
      el.textContent = count > 99 ? "99+" : String(count);
      el.classList.toggle("is-empty", count === 0);
      el.setAttribute("aria-hidden", count === 0 ? "true" : "false");
      if (label) el.setAttribute("aria-label", label);
      else el.removeAttribute("aria-label");
    });
  }

  function nvWriteCartCount(n) {
    try {
      localStorage.setItem(NV_CART_STORAGE_KEY, String(Math.max(0, Math.floor(n))));
    } catch {}
    nvSyncCartBadges();
  }

  function nvIncrementCartCount(amount) {
    const add = Number(amount);
    nvWriteCartCount(nvReadCartCount() + (Number.isFinite(add) && add > 0 ? add : 1));
  }

  window.nvIncrementCartCount = nvIncrementCartCount;
  window.nvSyncCartBadges = nvSyncCartBadges;

  nvSyncCartBadges();
  window.addEventListener("storage", e => {
    if (e.key === NV_CART_STORAGE_KEY) nvSyncCartBadges();
  });

  const fmtPrice = p => {
    const n = Number(String(p || "").replace(/[^\d.]/g, ""));
    return n ? "\u20BE" + n.toLocaleString("en-US") : "";
  };

  /* =========================
     HOME — Gallery entrance arrow (viewport intro + idle drift)
  ========================= */
  const nvGalleryEntrance = document.querySelector(".home-shop-preview .nv-gallery-entrance");
  const nvGalleryArrow = nvGalleryEntrance?.querySelector(".nv-gallery-entrance__arrow");
  if (nvGalleryEntrance && nvGalleryArrow && !nvGalleryEntrance.dataset.nvGalleryMotionBound && "IntersectionObserver" in window) {
    nvGalleryEntrance.dataset.nvGalleryMotionBound = "1";
    const motionOk = () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let playedIntro = false;
    let ambientScheduled = false;
    const INTRO_MS = 2750;

    const scheduleAmbient = () => {
      nvGalleryEntrance.classList.remove("nv-gallery-entrance--motion-intro");
      nvGalleryEntrance.classList.add("nv-gallery-entrance--motion-ambient");
    };

    const finishIntro = () => {
      if (ambientScheduled) return;
      ambientScheduled = true;
      nvGalleryArrow.removeEventListener("animationend", finishIntro);
      scheduleAmbient();
    };

    const io = new IntersectionObserver(
      entries => {
        for (const en of entries) {
          if (!en.isIntersecting || playedIntro) continue;
          playedIntro = true;
          io.disconnect();
          if (!motionOk()) return;
          nvGalleryEntrance.classList.add("nv-gallery-entrance--motion-intro");
          nvGalleryArrow.addEventListener("animationend", finishIntro);
          window.setTimeout(finishIntro, INTRO_MS + 120);
        }
      },
      { threshold: 0.26, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(nvGalleryEntrance);
  }

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

      openMenu.setAttribute("aria-expanded", "false");
      openMenu.setAttribute("aria-controls", menuOverlay.id || "menuOverlay");
      menuOverlay.setAttribute("role", "dialog");
      menuOverlay.setAttribute("aria-modal", "true");
      menuOverlay.setAttribute("aria-label", "Site navigation");

      let lastTouchOpenTs = 0;
      /** Locks scroll position (iOS + desktop) while mobile menu is open */
      let scrollLockState = null;

      const lockMenuScroll = () => {
        if (scrollLockState) return;
        const y = window.scrollY || window.pageYOffset || 0;
        scrollLockState = {
          y,
          html: document.documentElement.style.overflow || "",
          bodyTop: document.body.style.top || "",
        };
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${y}px`;
        document.body.style.width = "100%";
      };

      const unlockMenuScroll = () => {
        if (!scrollLockState) return;
        const { y, html, bodyTop } = scrollLockState;
        scrollLockState = null;
        document.documentElement.style.overflow = html;
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = bodyTop || "";
        document.body.style.width = "";
        window.scrollTo(0, y);
      };

      const menuFocusSelector =
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

      const trapMenuFocus = e => {
        if (e.key !== "Tab" || !menuOverlay.classList.contains("active")) return;
        const nodes = [...menuOverlay.querySelectorAll(menuFocusSelector)].filter(
          n =>
            !n.closest("[aria-hidden=true]") && !n.closest(".is-hidden")
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };

      const openMobileMenu = (ev) => {
        ev?.preventDefault();
        ev?.stopPropagation();
        menuOverlay.classList.add("active");
        openMenu.setAttribute("aria-expanded", "true");
        lockMenuScroll();
        window.setTimeout(() => closeMenu?.focus({ preventScroll: true }), 0);
      };

      const closeMobileMenu = (ev) => {
        ev?.preventDefault();
        ev?.stopPropagation();
        menuOverlay.classList.remove("active");
        openMenu.setAttribute("aria-expanded", "false");
        unlockMenuScroll();
        window.setTimeout(() => openMenu?.focus({ preventScroll: true }), 0);
      };

      document.addEventListener(
        "keydown",
        e => {
          if (e.key === "Escape" && menuOverlay.classList.contains("active")) {
            e.preventDefault();
            closeMobileMenu(e);
          }
        },
        true
      );

      menuOverlay.addEventListener("keydown", trapMenuFocus);

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
        link.addEventListener("click", () => closeMobileMenu());
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

  /**
   * LQIP cards use `.nv-lqip { opacity: 0 }` until `.nv-loaded` is applied.
   * Shop/modal: js/nv-gallery-modal.js (initShopItems, openProductModal).
   */
  window.nvRevealLqipImages = function(root) {
    const scope =
      root && typeof root.querySelectorAll === 'function' ? root : document;
    scope.querySelectorAll('img.nv-lqip').forEach(img => {
      if (img.dataset.nvRevealBound) return;
      img.dataset.nvRevealBound = '1';
      function reveal() {
        img.classList.add('nv-loaded');
        const p = img.parentNode;
        if (p && p.style) p.style.backgroundImage = '';
      }
      if (img.complete) {
        reveal();
      } else {
        img.addEventListener('load', reveal, { once: true });
        img.addEventListener('error', reveal, { once: true });
      }
    });
  };

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
    /** Load deferred hero media when a slide becomes active (homepage LCP optimization). */
    function nvHydrateHeroSlide(slide) {
      if (!slide) return;
      slide.querySelectorAll("source[data-nv-srcset]").forEach((source) => {
        if (!source.getAttribute("srcset")) {
          source.setAttribute("srcset", source.getAttribute("data-nv-srcset") || "");
        }
      });
      slide.querySelectorAll("img[data-nv-src]").forEach((img) => {
        if (!img.getAttribute("src")) {
          img.setAttribute("src", img.getAttribute("data-nv-src") || "");
        }
      });
    }

    /** Portrait vs landscape — only landscape gets mobile contain scaling (see style.css). */
    function nvHeroClassifySlideAspect(slide) {
      const img = slide?.querySelector("img");
      if (!img) return;
      const w =
        img.naturalWidth || parseInt(img.getAttribute("width"), 10) || 0;
      const h =
        img.naturalHeight || parseInt(img.getAttribute("height"), 10) || 0;
      if (w < 1 || h < 1) return;
      const isLandscape = w / h > 1.02;
      slide.classList.toggle("slide--landscape", isLandscape);
      slide.classList.toggle("slide--portrait", !isLandscape);
    }

    function nvHeroClassifyAllSlides() {
      slides.forEach((slide) => {
        const img = slide.querySelector("img");
        if (!img) return;
        nvHeroClassifySlideAspect(slide);
        if (!img.complete || !img.naturalWidth) {
          img.addEventListener(
            "load",
            () => nvHeroClassifySlideAspect(slide),
            { once: true }
          );
        }
      });
    }

    function show(i) {
      slides.forEach(s => s.classList.remove("active"));
      slides[i].classList.add("active");
      slideIndex = i;
      nvHydrateHeroSlide(slides[i]);
      nvHeroClassifySlideAspect(slides[i]);
      const nextIdx = (i + 1) % slides.length;
      if (nextIdx !== i) {
        nvHydrateHeroSlide(slides[nextIdx]);
        nvHeroClassifySlideAspect(slides[nextIdx]);
      }
    }

    nvHydrateHeroSlide(slides[0]);
    nvHeroClassifyAllSlides();

    /** Direct slide index (used by homepage hero pagination dots; keeps slideIndex in sync). */
    window.__nvHeroGoTo = function (idx) {
      if (typeof idx !== "number" || !slides.length) return;
      const n = ((idx % slides.length) + slides.length) % slides.length;
      show(n);
    };

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
  }

  /* Room preview: floating icon + separate tooltip (gallery + shop) */
  function initNvRoomPreviewCtas() {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll(".nv-room-preview-cta").forEach(wrap => {
      const btn = wrap.querySelector(".nv-room-preview-cta__btn");
      const tip = wrap.querySelector(".nv-room-preview-cta__tooltip");
      if (!btn || !tip || wrap.dataset.nvRoomTooltipBound) return;
      wrap.dataset.nvRoomTooltipBound = "1";

      if (reduced) {
        return;
      }

      const isMobileHint =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 900px)").matches;

      const INTRO_DELAY_MS = isMobileHint ? 500 : 550;
      const SHOW_MS = isMobileHint ? 2600 : 3200;

      let hideTimer = null;
      let introTimer = null;

      const clearHide = () => {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
      };

      const clearIntro = () => {
        if (introTimer) {
          clearTimeout(introTimer);
          introTimer = null;
        }
      };

      const showTip = () => {
        tip.classList.add("is-visible");
      };

      const hideTip = () => {
        tip.classList.remove("is-visible");
      };

      const showBrief = () => {
        showTip();
        clearHide();
        hideTimer = window.setTimeout(() => {
          hideTip();
          hideTimer = null;
        }, SHOW_MS);
      };

      const hideNow = () => {
        clearHide();
        clearIntro();
        hideTip();
      };

      const onUserEnter = () => {
        if (introTimer) {
          clearIntro();
          wrap.dataset.nvIntroCancelled = "1";
        }
        showBrief();
      };

      btn.addEventListener("pointerenter", onUserEnter);
      btn.addEventListener("pointerleave", hideNow);
      btn.addEventListener("focusin", onUserEnter);
      btn.addEventListener("focusout", hideNow);

      const scheduleIntroOnce = () => {
        if (wrap.dataset.nvIntroScheduled === "1") return;
        wrap.dataset.nvIntroScheduled = "1";
        introTimer = window.setTimeout(() => {
          introTimer = null;
          if (wrap.dataset.nvIntroCancelled === "1") return;
          showBrief();
        }, INTRO_DELAY_MS);
      };

      /* Brief auto-hint on load: mobile only; desktop keeps hover/focus tooltip */
      if (isMobileHint) {
        if ("IntersectionObserver" in window) {
          const io = new IntersectionObserver(
            entries => {
              for (const en of entries) {
                if (!en.isIntersecting || en.intersectionRatio < 0.12) continue;
                io.unobserve(wrap);
                scheduleIntroOnce();
                break;
              }
            },
            { threshold: [0, 0.12, 0.2] }
          );
          io.observe(wrap);
        } else {
          scheduleIntroOnce();
        }
      }
    });
  }

  initNvRoomPreviewCtas();

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
    let adminPath = './admin.html';
    if (location.pathname.includes('/products/')) adminPath = '../../admin.html';
    else if (
      location.pathname.includes('/artists/') ||
      location.pathname.includes('/sale/')
    ) {
      adminPath = '../admin.html';
    }

    window.open(adminPath, '_blank');
  }
});
