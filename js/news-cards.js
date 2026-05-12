/**
 * News cards: fade-up on scroll + edge shimmer cue (#news scope).
 */
(function () {
  "use strict";

  function reveal(items) {
    var reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("news-item--visible", "news-item--inview");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var idx = Number(el.dataset.newsRevealIdx || 0);
          el.style.transitionDelay = Math.min(idx * 68, 272) + "ms";
          el.classList.add("news-item--visible");
          obs.unobserve(el);
          window.requestAnimationFrame(function () {
            el.classList.add("news-item--inview");
          });
        });
      },
      { threshold: 0.11, rootMargin: "0px 0px -7% 0px" }
    );

    items.forEach(function (el, i) {
      el.dataset.newsRevealIdx = String(i);
      io.observe(el);
    });
  }

  window.initNewsCardReveal = function () {
    var root = document.getElementById("news");
    if (!root) return;
    var items = root.querySelectorAll(".news-item");
    if (!items.length) return;
    reveal(items);
  };

  function bootNewsCards() {
    window.initNewsCardReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootNewsCards);
  } else {
    bootNewsCards();
  }
})();
