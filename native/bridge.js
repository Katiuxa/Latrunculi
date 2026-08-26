"use strict";

window.latrunculiConsumeBack = function () {
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

window.LatrunculiAds = {
  enabled: false,
  bannerReady: false,
  async init() {
    return false;
  },
  async showBanner() {
    return false;
  },
  async hideBanner() {
    return false;
  },
  async showInterstitial() {
    return false;
  }
};

(function applyAndroidInsets() {
  document.documentElement.classList.add("android-app");
  const root = document.documentElement.style;
  if (!root.getPropertyValue("--android-inset-bottom") || root.getPropertyValue("--android-inset-bottom") === "0px") {
    root.setProperty("--android-inset-bottom", "80px");
  }
  if (!root.getPropertyValue("--android-inset-top") || root.getPropertyValue("--android-inset-top") === "0px") {
    root.setProperty("--android-inset-top", "36px");
  }
})();

window.addEventListener("pageshow", () => {
  try { if (window.latrunculiPrimeAudio) window.latrunculiPrimeAudio(); } catch (e) {}
});
window.addEventListener("focus", () => {
  try { if (window.latrunculiPrimeAudio) window.latrunculiPrimeAudio(); } catch (e) {}
});
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  },
  { passive: false }
);
