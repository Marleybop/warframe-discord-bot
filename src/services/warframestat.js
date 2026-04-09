// Community API wrapper — items, drops, search, enriched worldstate
// https://api.warframestat.us

const BASE_URL = 'https://api.warframestat.us';

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`warframestat ${res.status}: ${path}`);
  return res.json();
}

export async function searchItems(query) {
  return get(`/items/search/${encodeURIComponent(query)}`);
}

export async function getItem(query) {
  return get(`/items/${encodeURIComponent(query)}`);
}

export async function searchDrops(query) {
  return get(`/drops/search/${encodeURIComponent(query)}`);
}

export async function getWarframe(query) {
  return get(`/warframes/${encodeURIComponent(query)}`);
}

export async function getWeapon(query) {
  return get(`/weapons/${encodeURIComponent(query)}`);
}

export async function getMod(query) {
  return get(`/mods/${encodeURIComponent(query)}`);
}

export async function getArcane(query) {
  return get(`/arcanes/${encodeURIComponent(query)}`);
}
