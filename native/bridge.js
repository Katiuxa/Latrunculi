"use strict";

window.latrunculiConsumeBack = function () {
  if (window.LatrunculiAds && typeof window.LatrunculiAds.consumeBack === "function") {
    if (window.LatrunculiAds.consumeBack()) return true;
  }
  const openMenu = document.querySelector(".lang-menu:not([hidden])");
  if (openMenu) {
    document.querySelectorAll(".lang-menu").forEach((menu) => { menu.hidden = true; });
    document.querySelectorAll(".lang-fab").forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    return true;
  }
  const help = document.getElementById("overlay-help");
  if (help && help.classList.contains("show")) {
    const close = document.getElementById("help-close") || document.getElementById("help-x");
    if (close) close.click();
    return true;
  }
  const win = document.getElementById("overlay-win");
  if (win && win.classList.contains("show")) {
    const review = document.getElementById("win-review");
    if (review) review.click();
    return true;
  }
  const start = document.getElementById("overlay-start");
  if (start && start.classList.contains("show")) {
    const close = document.getElementById("start-close");
    if (close) close.click();
    return true;
  }
  if (document.body.classList.contains("is-tutorial")) {
    const exit = document.getElementById("btn-coach-exit");
    if (exit) exit.click();
    return true;
  }
  return false;
};

(function applyAndroidInsets() {
  document.documentElement.classList.add("android-app");
  const root = document.documentElement.style;
  const realNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  /* Nav bar is padded natively (0 in CSS). Desktop preview only needs a hairline. */
  const bottomDefault = realNative ? "0px" : "0px";
  const topDefault = realNative ? "36px" : "12px";
  if (!root.getPropertyValue("--android-inset-bottom")) {
    root.setProperty("--android-inset-bottom", bottomDefault);
  }
  if (!root.getPropertyValue("--android-inset-top") || root.getPropertyValue("--android-inset-top") === "0px") {
    root.setProperty("--android-inset-top", topDefault);
  }
})();

window.addEventListener("pageshow", () => {
  try { if (window.latrunculiPrimeAudio) window.latrunculiPrimeAudio(); } catch (e) {}
});
window.addEventListener("focus", () => {
  try { if (window.latrunculiPrimeAudio) window.latrunculiPrimeAudio(); } catch (e) {}
});
function isScrollableTouch(el) {
  let n = el;
  while (n && n !== document.body && n !== document.documentElement) {
    if (n.classList && (
      n.classList.contains("coach-scroll") ||
      n.classList.contains("coach-body") ||
      n.id === "guide-coach" ||
      n.id === "panel-rules" ||
      n.classList.contains("log") ||
      n.classList.contains("lang-menu") ||
      n.classList.contains("modal") ||
      n.classList.contains("help-body") ||
      n.classList.contains("boot-frame") ||
      n.classList.contains("lat-ad-interstitial__panel")
    )) return true;
    n = n.parentElement;
  }
  return false;
}
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
      return;
    }
    if (!isScrollableTouch(e.target)) e.preventDefault();
  },
  { passive: false }
);
