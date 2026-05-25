/**
 * Featured project detail — scroll reveal, accordion, share (page-scoped).
 */
(function () {
  'use strict';

  function initReveal() {
    var items = document.querySelectorAll('.page-art-project [data-art-reveal]');
    if (!items.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }
    );
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 0.04, 0.28) + 's';
      io.observe(el);
    });
  }

  function initAccordion() {
    document.querySelectorAll('[data-accordion-item]').forEach(function (item) {
      var btn = item.querySelector('.fp-accordion__trigger');
      var panel = item.querySelector('.fp-accordion__panel');
      if (!btn || !panel) return;

      function setOpen(open) {
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      }

      btn.addEventListener('click', function () {
        setOpen(!item.classList.contains('is-open'));
      });
    });
  }

  function initShare() {
    var btn = document.getElementById('shareBtn');
    var msg = document.getElementById('shareMsg');
    if (!btn) return;
    var url = btn.getAttribute('data-share-url') || location.href;
    var title = btn.getAttribute('data-share-title') || document.title;
    btn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          if (msg) {
            msg.style.display = 'block';
            setTimeout(function () {
              msg.style.display = 'none';
            }, 3000);
          }
        });
      }
    });
  }

  function init() {
    initReveal();
    initAccordion();
    initShare();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
