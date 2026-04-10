/**
 * Morning Stars — Sync Module
 * Auto-syncs state to the backend. No manual setup required.
 *
 * On first load: creates a family on the server automatically.
 * On subsequent loads: pulls latest state from server.
 * Every save() pushes to the server.
 * Polls every 10s for changes from other devices.
 */

const SYNC_STORAGE_KEY = 'morningStar_sync';
const POLL_INTERVAL    = 10000;

// Backend API URL — same origin when served from Spring Boot/Railway,
// or override here if frontend is hosted separately (e.g. Vercel).
const API_BASE = '';  // empty = same origin

let syncMeta     = loadSyncMeta();
let pollTimer    = null;
let syncBusy     = false;
let skipNextPush = false;

function loadSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveSyncMeta() {
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(syncMeta));
}

function getApiBase() {
  return syncMeta.apiUrl || API_BASE;
}

function isSyncEnabled() {
  return !!syncMeta.familyId;
}

// ── SYNC ON STARTUP (only if already linked) ─────────────────────
async function initSync() {
  if (!isSyncEnabled()) return;
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/family/${syncMeta.familyId}`);
    if (res.ok) {
      const data = await res.json();
      S = JSON.parse(data.stateJson);
      syncMeta.version = data.version;
      saveSyncMeta();
      skipNextPush = true;
      save();
      render();
    } else if (res.status === 404) {
      // Family was deleted (DB reset) — clear stale link
      syncMeta = {};
      saveSyncMeta();
    }
    startPolling();
  } catch (err) {
    console.warn('[Sync] init failed (offline?):', err.message);
  }
}

async function createFamily(base) {
  const res = await fetch(`${base}/api/family`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(S),
  });
  if (!res.ok) throw new Error('Failed to create family');
  const data = await res.json();
  syncMeta = { familyId: data.familyId, apiUrl: base, version: data.version };
  saveSyncMeta();
}

// ── JOIN FAMILY (from another device) ─────────────────────────────
async function syncJoinFamily(familyId, apiUrl) {
  const url = apiUrl || getApiBase();
  const res = await fetch(`${url}/api/family/${familyId}`);
  if (!res.ok) throw new Error('Family not found');
  const data = await res.json();
  S = JSON.parse(data.stateJson);
  syncMeta = { familyId, apiUrl: url, version: data.version };
  saveSyncMeta();
  skipNextPush = true;
  save();
  startPolling();
  render();
}

// ── PUSH STATE TO SERVER ──────────────────────────────────────────
async function syncPush() {
  if (!isSyncEnabled() || syncBusy) return;
  syncBusy = true;
  try {
    const res = await fetch(
      `${getApiBase()}/api/family/${syncMeta.familyId}?expectedVersion=${syncMeta.version || 0}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S) }
    );
    if (res.ok) {
      const data = await res.json();
      syncMeta.version = data.version;
      saveSyncMeta();
    } else if (res.status === 409) {
      const data = await res.json();
      S = JSON.parse(data.stateJson);
      syncMeta.version = data.version;
      saveSyncMeta();
      skipNextPush = true;
      save();
      render();
    }
  } catch (err) {
    console.warn('[Sync] push failed (offline?):', err.message);
  } finally {
    syncBusy = false;
  }
}

// ── POLL FOR CHANGES ──────────────────────────────────────────────
async function syncPoll() {
  if (!isSyncEnabled() || syncBusy) return;
  try {
    const res = await fetch(
      `${getApiBase()}/api/family/${syncMeta.familyId}/poll?version=${syncMeta.version || 0}`
    );
    if (res.status === 200) {
      const data = await res.json();
      S = JSON.parse(data.stateJson);
      syncMeta.version = data.version;
      saveSyncMeta();
      skipNextPush = true;
      save();
      render();
    }
  } catch (err) {
    console.warn('[Sync] poll failed (offline?):', err.message);
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  if (isSyncEnabled()) {
    pollTimer = setInterval(syncPoll, POLL_INTERVAL);
  }
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

// ── DISCONNECT ────────────────────────────────────────────────────
function syncDisconnect() {
  stopPolling();
  syncMeta = {};
  saveSyncMeta();
}
