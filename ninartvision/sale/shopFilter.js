document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const artistId = (params.get("id") || params.get("artist") || "").toLowerCase();

  const items = document.querySelectorAll(".shop-item");

  // If artistId is empty, show all items
  if (!artistId) return;

  items.forEach(item => {
    const a = (item.dataset.artist || "").toLowerCase();

    // ✅ მხოლოდ არტისტით გაფილტვრა (status აღარ ვეხებით)
    item.style.display = (a === artistId) ? "" : "none";
  });

  const title = document.querySelector("h2");
  if (title) title.textContent = `${artistId.toUpperCase()} artworks`;
});
