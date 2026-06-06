import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
};

/**
 * Content Script: Focus Mode Overlay
 * When Strict Mode is active and the current site is NOT on the whitelist,
 * this script injects a dimming overlay with a focus reminder.
 * It does NOT block the page — that is handled by the background service worker
 * via webNavigation. Instead, it provides a subtle visual cue.
 */

const OVERLAY_ID = "deepwork-focus-overlay";

function getHostname(): string {
  try {
    return new URL(window.location.href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function removeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
}

function injectOverlay() {
  if (document.getElementById(OVERLAY_ID)) return;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(10, 10, 11, 0.82);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    animation: deepwork-fadein 0.3s ease;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    background: #111113;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    padding: 40px;
    max-width: 420px;
    width: 90%;
    text-align: center;
    box-shadow: 0 32px 80px rgba(0,0,0,0.8);
  `;

  card.innerHTML = `
    <div style="
      width: 56px; height: 56px;
      background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.25);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      font-size: 24px;
    ">🧠</div>
    <h2 style="
      color: #fff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin: 0 0 8px;
    ">Deep Work Active</h2>
    <p style="
      color: rgba(255,255,255,0.45);
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 28px;
    ">
      <strong style="color:rgba(255,255,255,0.7)">${getHostname()}</strong>
      is not on your whitelist.<br>Stay on task — your future self will thank you.
    </p>
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="deepwork-go-back" style="
        background: #fff;
        color: #000;
        border: none;
        border-radius: 10px;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      ">← Go Back</button>
      <button id="deepwork-dismiss" style="
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.6);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      ">Proceed Anyway</button>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes deepwork-fadein {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;

  overlay.appendChild(style);
  overlay.appendChild(card);
  document.documentElement.appendChild(overlay);

  document.getElementById("deepwork-go-back")?.addEventListener("click", () => {
    history.back();
    removeOverlay();
  });

  document.getElementById("deepwork-dismiss")?.addEventListener("click", () => {
    removeOverlay();
  });
}

// Listen for messages from background to show/hide the overlay
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_FOCUS_OVERLAY") {
    injectOverlay();
  }
  if (message.type === "HIDE_FOCUS_OVERLAY") {
    removeOverlay();
  }
});

// On load, ask background if overlay should be shown
chrome.runtime.sendMessage({ type: "CHECK_FOCUS_OVERLAY" }, (response) => {
  if (chrome.runtime.lastError) return; // Tab might not be ready
  if (response?.shouldShow) {
    injectOverlay();
  }
});
