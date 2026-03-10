function scrollToForm() {
  document.getElementById("contactForm")
    .scrollIntoView({ behavior: "smooth" });
}

function setLang(lang, event) {
  // Prevent event propagation to avoid conflicts
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  document.querySelectorAll("[data-en]").forEach(el => {
    // Use innerHTML to properly render HTML tags in translations
    el.innerHTML = el.dataset[lang];
  });

  document.querySelectorAll(".lang-item").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(
    `.lang-item[onclick*="'${lang}'"]`
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Save language preference
  localStorage.setItem("siteLang", lang);
}

// Initialize language on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLang") || "ka";
  setLang(savedLang);

  // Add proper event listeners to language buttons
  document.querySelectorAll(".lang-item").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      const onclickAttr = this.getAttribute("onclick");
      const match = onclickAttr ? onclickAttr.match(/'(\w+)'/) : null;
      if (match) {
        setLang(match[1], e);
      }
    });
  });
});
