/**
 * Multilingual SEO — updates document title, meta description, and
 * Open Graph locale tags when the user switches KA / EN.
 */
(function () {
  var SEO = {
    ka: {
      title: 'Ninart Vision | ქართველი მხატვრები · ორიგინალური ნახატები',
      description:
        'ქართველი მხატვრების ორიგინალური ნახატები. თანამედროვე ხელოვნება, კოლექციური ნამუშევრები და ხელით შექმნილი ნაწარმოები.',
      ogTitle: 'Ninart Vision · ქართველი მხატვრები & Original Art',
      ogDescription:
        'ორიგინალური ნახატები ქართველი მხატვრებისგან. თანამედროვე ხელოვნება და კოლექციური ნამუშევრები.',
      locale: 'ka_GE',
      keywords:
        'Ninart Vision, თანამედროვე ხელოვნება, თანამედროვე ქართული ხელოვნება, ქართველი მხატვრები, ორიგინალური ნახატები, კოლექციური ნამუშევრები, თანამედროვე სანახავ',
    },
    en: {
      title: 'Ninart Vision | Georgian Artists & Original Paintings',
      description:
        'Original paintings by Georgian artists. Contemporary art, modern art gallery and collectible handcrafted artworks.',
      ogTitle: 'Ninart Vision · Georgian Artists & Original Art',
      ogDescription:
        'Original paintings by Georgian artists. Contemporary art, modern gallery & collectible handcrafted artworks.',
      locale: 'en_US',
      keywords:
        'Ninart Vision, Georgian contemporary art, Georgian artists, original paintings, modern art gallery, collectible artworks, contemporary art, handcrafted artworks',
    },
  };

  function setMeta(attr, name, content) {
    if (!content) return;
    var sel = 'meta[' + attr + '="' + name + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function applySeoLang(lang) {
    var l = lang === 'en' ? 'en' : 'ka';
    var pack = SEO[l];
    if (!pack) return;

    document.title = pack.title;
    setMeta('name', 'description', pack.description);
    setMeta('name', 'keywords', pack.keywords);
    setMeta('property', 'og:title', pack.ogTitle);
    setMeta('property', 'og:description', pack.ogDescription);
    setMeta('property', 'og:locale', pack.locale);
    setMeta('name', 'twitter:title', pack.ogTitle);
    setMeta('name', 'twitter:description', pack.ogDescription);
    try {
      document.documentElement.setAttribute('lang', l === 'ka' ? 'ka' : 'en');
    } catch (_) {}
  }

  window.nvApplySeoLang = applySeoLang;

  document.addEventListener('DOMContentLoaded', function () {
    var saved = 'ka';
    try {
      saved = localStorage.getItem('siteLang') || 'ka';
    } catch (_) {}
    applySeoLang(saved);
  });

  window.addEventListener('languageChanged', function (e) {
    var lang = (e && e.detail && e.detail.lang) || 'ka';
    applySeoLang(lang);
  });
})();
