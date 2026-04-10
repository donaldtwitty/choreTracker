/**
 * Morning Stars — State Management
 * S is the single global state object. All reads and writes go through here.
 */

const STORAGE_KEY = 'morningStar_v4';

/** Global mutable state — initialised by loadState() in app.js */
let S = null;

/** In-memory photo cache, keyed by kid id. Loaded from IndexedDB on startup. */
let photoCache = {};

// ── PIN HASHING ───────────────────────────────────────────────────
async function hashPin(pin) {
  const data = new TextEncoder().encode(pin);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Loads persisted state from localStorage, deep-merges with DEFAULT_STATE
 * so that new fields added in future updates are always present.
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const persisted = JSON.parse(raw);
      const merged = deepMerge(DEFAULT_STATE, persisted);

      // Ensure every kid has required fields
      merged.kids.forEach((kid) => {
        if (!('photo'   in kid)) kid.photo   = null;
        if (!('themeId' in kid)) kid.themeId = 'sunrise';
      });

      // Migrate chore objects: add fields that didn't exist in earlier versions
      ['dailyChores', 'eveningChores', 'weeklyChores'].forEach((type) => {
        merged.kids.forEach((kid) => {
          const list = merged[type][kid.id];
          if (!Array.isArray(list)) return;
          list.forEach((chore) => {
            if (!('note'   in chore)) chore.note   = '';
            if (!('shared' in chore)) chore.shared = false;
            if (!('alarm'  in chore)) chore.alarm  = 'none';
            if (type === 'weeklyChores' && !('day' in chore)) chore.day = 'any';
          });
        });
      });

      // Ensure evening chores exist (added in v4)
      if (!merged.eveningChores) {
        merged.eveningChores = {};
        merged.kids.forEach((kid) => {
          merged.eveningChores[kid.id] = DEFAULT_EVENING_CHORES.map((c) => ({ ...c }));
        });
      }

      if (!merged.completedEvening)  merged.completedEvening  = {};
      if (!Array.isArray(merged.pausedDays)) merged.pausedDays = [];

      if (!merged.completedShared) {
        merged.completedShared = { daily: {}, evening: {}, weekly: {} };
      }

      // Migrate plaintext PIN to hashed PIN (one-time)
      if (!merged.settings.pinHash) {
        merged.settings._pendingPinMigration = merged.settings.pin || '1234';
      }
      delete merged.settings.pin;

      pruneOldData(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Morning Stars: could not load saved state, using defaults.', err);
  }

  // First run — return a deep clone of the defaults
  const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
  // Mark for async PIN hash on first run
  fresh.settings._pendingPinMigration = '1234';
  delete fresh.settings.pin;
  return fresh;
}

/**
 * Async initialisation that runs after loadState():
 * - Hashes pending plaintext PIN
 * - Migrates photos from localStorage to IndexedDB
 * - Loads photos from IndexedDB into photoCache
 */
async function initAsync() {
  // Migrate plaintext PIN → hash
  if (S.settings._pendingPinMigration) {
    S.settings.pinHash = await hashPin(S.settings._pendingPinMigration);
    delete S.settings._pendingPinMigration;
    save();
  }

  // Migrate any photos still in state to IndexedDB
  const migrated = await migratePhotosToIDB(S);
  if (migrated) save();

  // Load all photos into memory cache
  photoCache = await loadAllPhotos(S.kids);
  render();
}

/** Persists the current state to localStorage and pushes to server if synced */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  } catch (err) {
    console.warn('Morning Stars: could not save state.', err);
  }
  // Push to backend if sync is active (skipNextPush breaks the save→push→save loop)
  if (typeof syncPush === 'function' && typeof isSyncEnabled === 'function' && isSyncEnabled()) {
    if (typeof skipNextPush !== 'undefined' && skipNextPush) {
      skipNextPush = false;
    } else {
      syncPush();
    }
  }
}

/**
 * Removes completed-chore entries older than 60 days and
 * weekly entries older than 90 days to prevent localStorage bloat.
 */
function pruneOldData(state) {
  const cutoff       = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr    = cutoff.toISOString().split('T')[0];

  const weeklyCutoff = new Date();
  weeklyCutoff.setDate(weeklyCutoff.getDate() - 90);
  const weeklyCutStr = weeklyCutoff.toISOString().split('T')[0];

  [state.completedDaily, state.completedEvening].forEach((bucket) => {
    if (!bucket) return;
    Object.keys(bucket).forEach((dateKey) => {
      if (dateKey < cutoffStr) delete bucket[dateKey];
    });
  });

  if (state.completedWeekly) {
    Object.keys(state.completedWeekly).forEach((wkKey) => {
      if (wkKey < weeklyCutStr) delete state.completedWeekly[wkKey];
    });
  }

  if (state.completedShared) {
    ['daily', 'evening'].forEach((type) => {
      if (!state.completedShared[type]) return;
      Object.keys(state.completedShared[type]).forEach((dateKey) => {
        if (dateKey < cutoffStr) delete state.completedShared[type][dateKey];
      });
    });
    if (state.completedShared.weekly) {
      Object.keys(state.completedShared.weekly).forEach((wkKey) => {
        if (wkKey < weeklyCutStr) delete state.completedShared.weekly[wkKey];
      });
    }
  }

  // Prune pausedDays
  if (Array.isArray(state.pausedDays)) {
    state.pausedDays = state.pausedDays.filter((d) => d >= cutoffStr);
  }
}

/**
 * Shallow-deep merges `base` with `override`, preserving nested objects
 * and arrays from `override` where they exist.
 */
function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      key in base &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}
