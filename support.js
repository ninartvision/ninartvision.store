function scrollToForm() {
  var el = document.getElementById("contactForm");
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "smooth" });
  }
}
