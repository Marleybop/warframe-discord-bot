import Database from 'better-sqlite3';
import { resolve } from 'path';
import { DATA_DIR } from '../config.js';

const db = new Database(resolve(DATA_DIR, 'cache.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create cache table
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    ttl INTEGER NOT NULL
  )
`);

const getStmt = db.prepare('SELECT value, updated_at, ttl FROM cache WHERE key = ?');
const setStmt = db.prepare('INSERT OR REPLACE INTO cache (key, value, updated_at, ttl) VALUES (?, ?, ?, ?)');
const delStmt = db.prepare('DELETE FROM cache WHERE key = ?');

// Get a cached value. Returns parsed JSON or null.
// If expired but stale=true, returns stale data (for API fallback).
export function get(key, { stale = false } = {}) {
  const row = getStmt.get(key);
  if (!row) return null;

  const age = Date.now() - row.updated_at;
  if (age > row.ttl && !stale) return null;

  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

// Store a value with a TTL (in ms).
export function set(key, value, ttl) {
  setStmt.run(key, JSON.stringify(value), Date.now(), ttl);
}

// Delete a cached value.
export function del(key) {
  delStmt.run(key);
}

// Check if a cached value is fresh (not expired).
export function isFresh(key) {
  const row = getStmt.get(key);
  if (!row) return false;
  return (Date.now() - row.updated_at) <= row.ttl;
}

// Fetch-with-cache helper:
// Tries cache first, calls fetchFn on miss, caches result.
// On fetch failure, returns stale cached data if available.
export async function cached(key, ttl, fetchFn) {
  const fresh = get(key);
  if (fresh) return fresh;

  try {
    const data = await fetchFn();
    set(key, data, ttl);
    return data;
  } catch (err) {
    // Return stale data on failure
    const stale = get(key, { stale: true });
    if (stale) {
      console.warn(`[cache] Using stale data for "${key}": ${err.message}`);
      return stale;
    }
    throw err;
  }
}
