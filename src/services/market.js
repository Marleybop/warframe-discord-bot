// warframe.market API client — prices, orders, items
// https://warframe.market/api_docs
// Rate limit: 3 req/sec

import { cached } from './cache.js';

const V1_URL = 'https://api.warframe.market/v1';
const V2_URL = 'https://api.warframe.market/v2';
const ASSET_URL = 'https://warframe.market/static/assets';

const TTL_ITEMS = 6 * 60 * 60 * 1000;  // 6 hours — item list rarely changes
const TTL_STATS = 15 * 60 * 1000;       // 15 minutes — prices update frequently

async function getV1(path) {
  const res = await fetch(`${V1_URL}${path}`, {
    headers: { Platform: 'pc', Language: 'en' },
  });
  if (!res.ok) throw new Error(`market v1 ${res.status}: ${path}`);
  const json = await res.json();
  return json.payload;
}

async function getV2(path) {
  const res = await fetch(`${V2_URL}${path}`, {
    headers: { Platform: 'pc', Language: 'en' },
  });
  if (!res.ok) throw new Error(`market v2 ${res.status}: ${path}`);
  const json = await res.json();
  return json.data;
}

export async function getItemList() {
  return cached('market:items', TTL_ITEMS, () => getV2('/items'));
}

export async function getItemDetail(slug) {
  return cached(`market:item:${slug}`, TTL_ITEMS, () =>
    getV2(`/items/${encodeURIComponent(slug)}`)
  );
}

export async function getOrders(slug) {
  return cached(`market:orders:${slug}`, TTL_STATS, () =>
    getV2(`/orders/item/${encodeURIComponent(slug)}`)
  );
}

export async function getStatistics(urlName) {
  return cached(`market:stats:${urlName}`, TTL_STATS, () =>
    getV1(`/items/${encodeURIComponent(urlName)}/statistics`)
  );
}

export function assetUrl(path) {
  return `${ASSET_URL}/${path}`;
}
