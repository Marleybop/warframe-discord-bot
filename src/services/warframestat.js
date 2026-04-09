// Community API wrapper — items, drops, search, enriched worldstate
// https://api.warframestat.us

import { cached } from './cache.js';

const BASE_URL = 'https://api.warframestat.us';

const TTL_SEARCH = 30 * 60 * 1000;  // 30 minutes — search results
const TTL_ITEM = 6 * 60 * 60 * 1000; // 6 hours — item data rarely changes

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`warframestat ${res.status}: ${path}`);
  return res.json();
}

export async function searchItems(query) {
  return cached(`wfstat:items:${query.toLowerCase()}`, TTL_SEARCH, () =>
    get(`/items/search/${encodeURIComponent(query)}`)
  );
}

export async function getItem(query) {
  return cached(`wfstat:item:${query.toLowerCase()}`, TTL_ITEM, () =>
    get(`/items/${encodeURIComponent(query)}`)
  );
}

export async function searchDrops(query) {
  return cached(`wfstat:drops:${query.toLowerCase()}`, TTL_SEARCH, () =>
    get(`/drops/search/${encodeURIComponent(query)}`)
  );
}

export async function getWarframe(query) {
  return cached(`wfstat:warframe:${query.toLowerCase()}`, TTL_ITEM, () =>
    get(`/warframes/${encodeURIComponent(query)}`)
  );
}

export async function getWeapon(query) {
  return cached(`wfstat:weapon:${query.toLowerCase()}`, TTL_ITEM, () =>
    get(`/weapons/${encodeURIComponent(query)}`)
  );
}

export async function getMod(query) {
  return cached(`wfstat:mod:${query.toLowerCase()}`, TTL_ITEM, () =>
    get(`/mods/${encodeURIComponent(query)}`)
  );
}

export async function getArcane(query) {
  return cached(`wfstat:arcane:${query.toLowerCase()}`, TTL_ITEM, () =>
    get(`/arcanes/${encodeURIComponent(query)}`)
  );
}
