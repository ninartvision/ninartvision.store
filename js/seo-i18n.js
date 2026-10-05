/**
 * Multilingual SEO — updates document title, meta description, and
 * Open Graph locale tags when the user switches KA / EN.
 */
(function () {
  var SEO = {
    ka: {
      title: 'Ninart Vision-ის გალერეა | ქართველი მხატვარი ნინი მჟავია',
      description:
        'დაათვალიერეთ ქართველი მხატვრის, ნინი მჟავიას ნახატები Ninart Vision-ის გალერეაში. გაეცანით მის ხელოვნებას და თითოეული ნამუშევრის ისტორიას.',
      ogTitle: 'Ninart Vision-ის გალერეა | ქართველი მხატვარი ნინი მჟავია',
      ogDescription:
        'დაათვალიერეთ ქართველი მხატვრის, ნინი მჟავიას ნახატები Ninart Vision-ის გალერეაში. გაეცანით მის ხელოვნებას და თითოეული ნამუშევრის ისტორიას.',
      locale: 'ka_GE',
      keywords:
        'Ninart Vision, თანამედროვე ხელოვნება, თანამედროვე ქართული ხელოვნება, ქართველი მხატვრები, ორიგინალური ნახატები, კოლექციური ნამუშევრები, თანამედროვე სანახავ',
    },
    en: {
      title: 'Ninart Vision Gallery | Georgian Artist Nini Mzhavia',
      description:
        'Explore paintings by Georgian artist Nini Mzhavia in the Ninart Vision gallery. View her artwork and discover the stories behind each piece.',
      ogTitle: 'Ninart Vision Gallery | Georgian Artist Nini Mzhavia',
      ogDescription:
        'Explore paintings by Georgian artist Nini Mzhavia in the Ninart Vision gallery. View her artwork and discover the stories behind each piece.',
      locale: 'en_US',
      keywords:
        'Ninart Vision gallery, Nini Mzhavia, Georgian artist, paintings, original artwork',
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
