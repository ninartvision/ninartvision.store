/**
 * KA / EN language switch — reads data-en + data-ka via getAttribute (reliable vs dataset quirks).
 */
function nvResolveLangFromButton(btn) {
  if (!btn) return null;
  var dl = btn.getAttribute("data-lang");
  if (dl) return String(dl).toLowerCase();
  var oc = btn.getAttribute("onclick") || "";
  var m = oc.match(/setLang\s*\(\s*['"](\w+)['"]/);
  return m ? String(m[1]).toLowerCase() : null;
}

function nvIsForbiddenI18nNode(el) {
  if (!el || el.nodeType !== 1) return true;
  var tag = String(el.tagName || "").toUpperCase();
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEMPLATE") return true;
  try {
    if (typeof el.closest === "function") {
      if (el.closest("script,style,noscript,template")) return true;
    }
  } catch (_) {}
  return false;
}

function nvNormalizeI18nString(s) {
  if (s == null) return null;
  var t = String(s);
  if (!t.trim()) return null;
  if (t.toLowerCase().trim() === "undefined") return null;
  return t;
}

function setLangButtonsActive(lang) {
  document.querySelectorAll(".lang-item").forEach(function (btn) {
    var lid = nvResolveLangFromButton(btn);
    var on = lid === lang;
    btn.classList.toggle("active", on);
    try {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    } catch (_) {}
  });
}

/** Apply stored text for lang from data-{lang}; never writes "undefined" or wipes on bad values. */
function setLang(rawLang, event) {
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
    event.preventDefault();
  }

  var lang = String(rawLang || "ka").toLowerCase();
  if (lang !== "en" && lang !== "ka") lang = "ka";
  var alt = lang === "en" ? "ka" : "en";

  document.querySelectorAll("[data-en], [data-ka]").forEach(function (el) {
    if (nvIsForbiddenI18nNode(el)) return;
    var txt = nvNormalizeI18nString(el.getAttribute("data-" + lang));
    if (txt == null) txt = nvNormalizeI18nString(el.getAttribute("data-" + alt));
    if (txt == null) return;
    el.innerHTML = txt;
  });

  document
    .querySelectorAll("[data-en-placeholder], [data-ka-placeholder]")
    .forEach(function (el) {
      if (nvIsForbiddenI18nNode(el)) return;
      var tg = String(el.tagName || "").toUpperCase();
      if (tg !== "INPUT" && tg !== "TEXTAREA") return;
      var ph =
        nvNormalizeI18nString(el.getAttribute("data-" + lang + "-placeholder")) ||
        nvNormalizeI18nString(el.getAttribute("data-" + alt + "-placeholder"));
      if (ph == null) return;
      try {
        el.setAttribute("placeholder", ph);
      } catch (_) {}
    });

  setLangButtonsActive(lang);
  localStorage.setItem("siteLang", lang);

  try {
    document.documentElement.setAttribute("lang", lang === "ka" ? "ka" : "en");
    document.documentElement.setAttribute("data-site-lang", lang);
  } catch (_) {}

  try {
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: lang } }));
  } catch (_) {}
}

/** Optional: callers may rely on an explicit global in some tooling environments */
try {
  window.setLang = setLang;
} catch (_) {}

document.addEventListener("DOMContentLoaded", function () {
  var savedLang = "ka";
  try {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("lang");
    savedLang = fromUrl || localStorage.getItem("siteLang") || "ka";
  } catch (_) {
    try {
      savedLang = localStorage.getItem("siteLang") || "ka";
    } catch (__) {}
  }
  setLang(savedLang);

  document.querySelectorAll(".lang-item").forEach(function (btn) {
    if (btn.dataset.nvLangBound === "1") return;
    btn.dataset.nvLangBound = "1";
    btn.addEventListener(
      "click",
      function (e) {
        var l = nvResolveLangFromButton(btn);
        if (l) setLang(l, e);
      },
      false
    );
  });
});
