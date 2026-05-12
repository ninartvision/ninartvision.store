function setLang(lang) {
  // ტექსტების შეცვლა
  document.querySelectorAll("[data-en]").forEach(el => {
    el.innerHTML = el.dataset[lang];
  });

  // active კლასის მართვა
  document.querySelectorAll(".lang-item").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(
    `.lang-item[data-lang="${lang}"]`
  );
  if (activeBtn) activeBtn.classList.add("active");

  // ენის დამახსოვრება
  localStorage.setItem("siteLang", lang);
}

// გვერდის ჩატვირთვისას – KA default
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLang") || "ka";
  setLang(savedLang);

  document.querySelectorAll(".lang-item").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      setLang(this.dataset.lang);
    });
  });
});
