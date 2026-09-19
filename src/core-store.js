/* IELTS Focus durable browser store
 * Independent implementation. No third-party project source copied.
 */
(function (global) {
  'use strict';

  const DB_NAME = 'IELTSFocusDB';
  const DB_VERSION = 1;
  const LEGACY_KEY = 'ieltsFocusAppV3';

  const STORES = Object.freeze({
    settings: 'settings',
    progress: 'progress',
    attempts: 'attempts',
    reviews: 'reviews'
  });

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORES.settings)) db.createObjectStore(STORES.settings);
        if (!db.objectStoreNames.contains(STORES.progress)) db.createObjectStore(STORES.progress);
        if (!db.objectStoreNames.contains(STORES.attempts)) {
          const store = db.createObjectStore(STORES.attempts, { keyPath: 'id' });
          store.createIndex('completedAt', 'completedAt', { unique: false });
          store.createIndex('skill', 'skill', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.reviews)) db.createObjectStore(STORES.reviews, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
  }

  async function withStore(storeName, mode, fn) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let value;
        try { value = fn(store); } catch (error) { reject(error); return; }
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      });
    } finally {
      db.close();
    }
  }

  async function set(store, key, value) {
    return withStore(store, 'readwrite', s => s.put(value, key));
  }

  async function get(store, key) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || tx.error);
      });
    } finally {
      db.close();
    }
  }

  async function putAttempt(attempt) {
    const now = new Date().toISOString();
    const value = Object.assign({
      id: (crypto.randomUUID ? crypto.randomUUID() : 'attempt-' + Date.now() + '-' + Math.random().toString(16).slice(2)),
      completedAt: now,
      skill: 'other',
      correct: null,
      total: null,
      durationSec: null
    }, attempt || {});
    await withStore(STORES.attempts, 'readwrite', s => s.put(value));
    return value;
  }

  async function listAttempts() {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.attempts, 'readonly');
        const req = tx.objectStore(STORES.attempts).getAll();
        req.onsuccess = () => resolve((req.result || []).sort((a,b) => String(b.completedAt).localeCompare(String(a.completedAt))));
        req.onerror = () => reject(req.error || tx.error);
      });
    } finally {
      db.close();
    }
  }

  async function exportBackup() {
    const result = { format:'ielts-focus-backup', version:1, exportedAt:new Date().toISOString(), stores:{} };
    const db = await openDB();
    try {
      for (const name of Object.values(STORES)) {
        result.stores[name] = await new Promise((resolve, reject) => {
          const tx = db.transaction(name, 'readonly');
          const req = tx.objectStore(name).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error || tx.error);
        });
      }
    } finally {
      db.close();
    }
    return result;
  }

  async function migrateLegacy() {
    let raw = null;
    try { raw = localStorage.getItem(LEGACY_KEY); } catch (_) {}
    if (!raw) return { migrated:false, reason:'no-legacy-state' };

    const already = await get(STORES.settings, 'legacyMigrated');
    if (already) return { migrated:false, reason:'already-migrated' };

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (_) { return { migrated:false, reason:'invalid-json' }; }

    await set(STORES.progress, 'legacyState', parsed);
    await set(STORES.settings, 'legacyMigrated', {
      from: LEGACY_KEY,
      at: new Date().toISOString()
    });
    return { migrated:true };
  }

  global.IELTSCoreStore = Object.freeze({
    DB_NAME, STORES, openDB, set, get, putAttempt, listAttempts,
    exportBackup, migrateLegacy
  });
})(window);
