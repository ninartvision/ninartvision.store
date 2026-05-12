/**
 * Editorial divider: desktop hover proximity + touch scroll reveal.
 * Supports multiple [data-editorial-rule] roots per page.
 */
(function () {
  "use strict";

  function initEditorialRules() {
    var roots = document.querySelectorAll("[data-editorial-rule]");
    if (!roots.length) return;

    var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
    var mqReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var syncFns = [];

    function initEditorialRule(root) {
      var sensor = root.querySelector(".editorial-rule__sensor");
      var lines = root.querySelector(".editorial-rule__lines");
      if (!sensor || !lines) return;

      var targetX = 50;
      var curX = 50;
      var targetProx = 0;
      var curProx = 0;
      var rafId = null;

      function setVars() {
        root.style.setProperty("--rule-x", String(Math.round(curX * 1000) / 1000));
        root.style.setProperty(
          "--rule-proximity",
          String(Math.round(curProx * 1000) / 1000)
        );
        root.classList.toggle("editorial-rule--active", curProx > 0.06);
      }

      function tick() {
        curX += (targetX - curX) * 0.13;
        curProx += (targetProx - curProx) * 0.11;
        if (Math.abs(targetX - curX) < 0.08) curX = targetX;
        if (Math.abs(targetProx - curProx) < 0.005) curProx = targetProx;
        setVars();
        if (
          Math.abs(targetX - curX) > 0.02 ||
          Math.abs(targetProx - curProx) > 0.004
        ) {
          rafId = window.requestAnimationFrame(tick);
        } else {
          rafId = null;
        }
      }

      function requestTick() {
        if (!rafId) rafId = window.requestAnimationFrame(tick);
      }

      function onMove(e) {
        var rect = lines.getBoundingClientRect();
        var w = Math.max(rect.width, 1);
        var x = ((e.clientX - rect.left) / w) * 100;
        targetX = Math.max(0, Math.min(100, x));
        targetProx = 1;
        requestTick();
      }

      function onLeave() {
        targetProx = 0;
        requestTick();
      }

      function bindDesktop() {
        sensor.addEventListener("mousemove", onMove, { passive: true });
        sensor.addEventListener("mouseleave", onLeave);
      }

      function unbindDesktop() {
        sensor.removeEventListener("mousemove", onMove);
        sensor.removeEventListener("mouseleave", onLeave);
        targetProx = 0;
        requestTick();
      }

      function syncPointerMode() {
        if (mqReduced) {
          root.classList.remove("editorial-rule--pointer");
          root.classList.add("editorial-rule--mobile-inview");
          unbindDesktop();
          return;
        }

        if (mqFine.matches) {
          root.classList.add("editorial-rule--pointer");
          root.classList.remove("editorial-rule--mobile-inview");
          bindDesktop();
        } else {
          root.classList.remove("editorial-rule--pointer");
          root.classList.remove("editorial-rule--active");
          unbindDesktop();
        }
      }

      syncFns.push(syncPointerMode);
      syncPointerMode();

      if (mqReduced) return;

      if (!mqFine.matches) {
        if ("IntersectionObserver" in window) {
          var io = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                root.classList.add("editorial-rule--mobile-inview");
                io.disconnect();
              });
            },
            {
              threshold: [0, 0.02, 0.06, 0.12],
              rootMargin: "0px 0px -4% 0px",
            }
          );
          io.observe(root);
        } else {
          root.classList.add("editorial-rule--mobile-inview");
        }
      }
    }

    for (var i = 0; i < roots.length; i++) {
      initEditorialRule(roots[i]);
    }

    function onMqFineChange() {
      for (var j = 0; j < syncFns.length; j++) syncFns[j]();
    }

    if (mqFine.addEventListener) {
      mqFine.addEventListener("change", onMqFineChange);
    } else if (mqFine.addListener) {
      mqFine.addListener(onMqFineChange);
    }
  }

  function initEditorialHeadingReveal() {
    var headings = document.querySelectorAll(".editorial-heading[data-editorial-reveal]");
    if (!headings.length) return;

    var mqReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function reveal(el) {
      el.classList.add("editorial-heading--inview");
    }

    if (mqReduced) {
      for (var i = 0; i < headings.length; i++) reveal(headings[i]);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      for (var j = 0; j < headings.length; j++) reveal(headings[j]);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    for (var k = 0; k < headings.length; k++) io.observe(headings[k]);
  }

  function initHomeShopExpandRule() {
    var section = document.querySelector("section.home-shop-preview.section");
    if (!section) return;

    var ruleRoot = section.querySelector("[data-home-shop-expand-rule]");
    var cta = section.querySelector("a.btn");
    if (!ruleRoot || !cta) return;

    var mqReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (mqReduced) {
      section.classList.add("home-shop-preview--expand-rule-inview");
      return;
    }

    var mqFinePointer =
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)");

    function bindHoverExpand() {
      function show() {
        section.classList.add("home-shop-preview--expand-rule-hover");
      }
      function hide() {
        section.classList.remove("home-shop-preview--expand-rule-hover");
      }
      cta.addEventListener("mouseenter", show);
      cta.addEventListener("mouseleave", hide);
      cta.addEventListener("focus", show);
      cta.addEventListener("blur", hide);
    }

    function bindScrollExpand() {
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              section.classList.add("home-shop-preview--expand-rule-inview");
              io.disconnect();
            });
          },
          { threshold: [0, 0.06, 0.14], rootMargin: "0px 0px -4% 0px" }
        );
        io.observe(ruleRoot);
      } else {
        section.classList.add("home-shop-preview--expand-rule-inview");
      }
    }

    if (mqFinePointer && mqFinePointer.matches) {
      bindHoverExpand();
    } else {
      bindScrollExpand();
    }
  }

  function boot() {
    initEditorialRules();
    initEditorialHeadingReveal();
    initHomeShopExpandRule();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
