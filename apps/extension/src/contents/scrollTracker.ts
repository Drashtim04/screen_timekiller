import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
};

/**
 * Content Script: Scroll Tracker
 * Monitors scroll velocity and reports EXCESSIVE_SCROLL events to the background
 * when the user is rapidly scrolling (a strong indicator of mindless browsing).
 */

const VELOCITY_THRESHOLD = 800;   // px/s — above this is "excessive"
const COOLDOWN_MS = 8000;          // Report at most once every 8 seconds

let lastScrollY = window.scrollY;
let lastScrollTime = Date.now();
let lastReportTime = 0;

function getScrollVelocity(): number {
  const now = Date.now();
  const dy = Math.abs(window.scrollY - lastScrollY);
  const dt = (now - lastScrollTime) / 1000; // seconds

  lastScrollY = window.scrollY;
  lastScrollTime = now;

  if (dt <= 0) return 0;
  return dy / dt;
}

window.addEventListener("scroll", () => {
  const velocity = getScrollVelocity();

  if (velocity > VELOCITY_THRESHOLD) {
    const now = Date.now();
    if (now - lastReportTime > COOLDOWN_MS) {
      lastReportTime = now;
      chrome.runtime.sendMessage({
        type: "BEHAVIOR_EVENT",
        payload: "EXCESSIVE_SCROLL",
      });
    }
  }
}, { passive: true });
