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

function setLangButtonsActive(lang) {
  document.querySelectorAll(".lang-item").forEach(function (btn) {
    var lid = nvResolveLangFromButton(btn);
    btn.classList.toggle("active", lid === lang);
  });
}

/** Apply stored text for lang from data-{lang}; never writes "undefined". */
function setLang(rawLang, event) {
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
    event.preventDefault();
  }

  var lang = String(rawLang || "ka").toLowerCase();
  if (lang !== "en" && lang !== "ka") lang = "ka";
  var alt = lang === "en" ? "ka" : "en";

  document.querySelectorAll("[data-en], [data-ka]").forEach(function (el) {
    var txt = el.getAttribute("data-" + lang);
    if (txt == null || txt === "") txt = el.getAttribute("data-" + alt);
    if (txt == null) return;
    el.innerHTML = txt;
  });

  setLangButtonsActive(lang);
  localStorage.setItem("siteLang", lang);

  try {
    document.documentElement.setAttribute("lang", lang === "ka" ? "ka" : "en");
  } catch (_) {}

  try {
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: lang } }));
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", function () {
  var savedLang = localStorage.getItem("siteLang") || "ka";
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
