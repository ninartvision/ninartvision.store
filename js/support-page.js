(function () {
  var page = document.querySelector(".page-support");
  if (!page) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll reveal */
  var nodes = document.querySelectorAll(".page-support [data-sp-reveal]");
  if (nodes.length) {
    if (!("IntersectionObserver" in window) || reduced) {
      nodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      nodes.forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  /* Gentle parallax on decorative layers */
  if (reduced) return;

  var shapes = document.querySelector(".support-page__shapes");
  var art = document.querySelector(".support-page__art");
  var floatLayer = document.querySelector(".support-page__float");

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0;
      var factor = Math.min(y * 0.04, 48);
      if (shapes) {
        shapes.style.transform = "translate3d(0," + factor * 0.35 + "px,0)";
      }
      if (art) {
        art.style.transform = "translate3d(0," + factor * 0.2 + "px,0)";
      }
      if (floatLayer) {
        floatLayer.style.transform = "translate3d(0," + factor * 0.15 + "px,0)";
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
