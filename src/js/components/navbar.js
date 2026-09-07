// Nav button clicks that open panels are wired generically via the
// [data-panel] attribute in panelSystem.js — this module only owns the
// mobile hamburger drawer behavior.
export function initNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener("click", () => navLinks.classList.toggle("active"));
  navLinks.querySelectorAll("button, a").forEach((el) => {
    el.addEventListener("click", () => navLinks.classList.remove("active"));
  });
}