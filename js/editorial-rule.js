/**
 * Editorial divider: desktop hover proximity + touch scroll reveal.
 * Supports multiple [data-editorial-rule] roots per page.
 */
(function () {
  "use strict";

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

    if (!mqFine.matches && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            root.classList.add("editorial-rule--mobile-inview");
            io.disconnect();
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
      );
      io.observe(root);
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
})();
