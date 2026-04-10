/**
 * Morning Stars — App Entry Point
 * Initialises state, registers the service worker, and renders the first view.
 */

// ── INITIALISE ────────────────────────────────────────────────────
S = loadState();
render();
initAsync();

// Start sync after state is loaded
if (typeof initSync === 'function') {
  initSync();
}

// ── SERVICE WORKER REGISTRATION ───────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        console.log('[Morning Stars] Service worker registered:', registration.scope);

        // Prompt the user to refresh when a new version is available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Morning Stars] Update available — reload to apply.');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[Morning Stars] Service worker registration failed:', err);
      });
  });
}

// ── INSTALL PROMPT (Android) ──────────────────────────────────────
// Capture the beforeinstallprompt event so we can trigger it later if desired.
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  console.log('[Morning Stars] App installed.');
});
