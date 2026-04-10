/**
 * Morning Stars — Photo Storage (IndexedDB)
 * Stores kid photos in IndexedDB instead of localStorage to avoid the ~5MB limit.
 */

const PHOTO_DB_NAME = 'morningStarsPhotos';
const PHOTO_DB_VER  = 1;
const PHOTO_STORE   = 'photos';

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB_NAME, PHOTO_DB_VER);
    req.onupgradeneeded = () => req.result.createObjectStore(PHOTO_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function savePhoto(kidId, dataUrl) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(dataUrl, kidId);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function loadPhoto(kidId) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(PHOTO_STORE, 'readonly');
    const req = tx.objectStore(PHOTO_STORE).get(kidId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

async function deletePhoto(kidId) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(kidId);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function loadAllPhotos(kids) {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const store = tx.objectStore(PHOTO_STORE);
    const results = {};
    await Promise.all(kids.map((kid) => new Promise((resolve) => {
      const req = store.get(kid.id);
      req.onsuccess = () => { results[kid.id] = req.result || null; resolve(); };
      req.onerror   = () => { results[kid.id] = null; resolve(); };
    })));
    return results;
  } catch {
    return {};
  }
}

/** Migrate photos from localStorage state into IndexedDB (one-time) */
async function migratePhotosToIDB(state) {
  let migrated = false;
  for (const kid of state.kids) {
    if (kid.photo) {
      await savePhoto(kid.id, kid.photo);
      kid.photo = null;
      migrated = true;
    }
  }
  return migrated;
}
