// Saves live in the browser's localStorage for now (frontend only).
// Each theory is stored under its own key, plus a small index for the Saves screen.
import { normalizeTheory } from './model.js';

const PREFIX = 'teoretik:';
const INDEX_KEY = PREFIX + 'index';
const LAST_KEY = PREFIX + 'last';
const theoryKey = (id) => PREFIX + 'theory:' + id;

function readIndex() {
  try {
    const v = JSON.parse(localStorage.getItem(INDEX_KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const writeIndex = (idx) => localStorage.setItem(INDEX_KEY, JSON.stringify(idx));

function indexEntry(t) {
  const firstImage = t.blocks.find((b) => b.image)?.image || null;
  return {
    id: t.id,
    title: t.title,
    updatedAt: t.updatedAt,
    createdAt: t.createdAt,
    blocks: t.blocks.length,
    links: t.links.length,
    languages: t.languages,
    hasImage: !!firstImage,
  };
}

export function listTheories() {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadTheory(id) {
  try {
    const raw = JSON.parse(localStorage.getItem(theoryKey(id)));
    return raw ? normalizeTheory(raw) : null;
  } catch (err) {
    console.warn('Could not load theory', id, err);
    return null;
  }
}

/**
 * Writes a theory to storage and returns the saved copy.
 * `touch` bumps "last edited" (off for camera moves).
 * Throws a DOMException (QuotaExceededError) when storage is full.
 */
export function saveTheory(theory, { touch = true } = {}) {
  const t = touch ? { ...theory, updatedAt: Date.now() } : theory;
  localStorage.setItem(theoryKey(t.id), JSON.stringify(t));
  const idx = readIndex().filter((e) => e.id !== t.id);
  idx.push(indexEntry(t));
  writeIndex(idx);
  return t;
}

export function deleteTheory(id) {
  localStorage.removeItem(theoryKey(id));
  writeIndex(readIndex().filter((e) => e.id !== id));
  if (localStorage.getItem(LAST_KEY) === id) localStorage.removeItem(LAST_KEY);
}

export const lastOpened = {
  get: () => localStorage.getItem(LAST_KEY),
  set: (id) => localStorage.setItem(LAST_KEY, id),
};

/** Rough bytes used by Teoretik (localStorage stores UTF-16). */
export function storageUsed() {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(PREFIX)) n += (k.length + (localStorage.getItem(k) || '').length) * 2;
  }
  return n;
}

export const STORAGE_BUDGET = 5 * 1024 * 1024; // typical browser limit per site
