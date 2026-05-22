// ── mayBlog shared theme ──────────────────────────
// One key "mbTheme" in localStorage, shared across all pages.
// Import this in every page's script: import './theme.js'
// Or load it as: <script src="js/theme.js"></script> before other scripts.

(function () {
  const KEY = "mbTheme";

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    // Update every toggle button on the page
    document.querySelectorAll(".theme-btn").forEach(btn => {
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
    });
  }

  // Apply immediately (before paint) to prevent flash
  apply(localStorage.getItem(KEY) || "dark");

  // Wire up all .theme-btn buttons once DOM is ready
  function wireButtons() {
    document.querySelectorAll(".theme-btn").forEach(btn => {
      // Avoid double-binding
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll(".theme-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        localStorage.setItem(KEY, next);
        apply(next);
        // Broadcast to other open tabs/pages
        window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: next }));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireButtons);
  } else {
    wireButtons();
  }

  // Sync when another tab changes the theme
  window.addEventListener("storage", e => {
    if (e.key === KEY && e.newValue) apply(e.newValue);
  });
})();
