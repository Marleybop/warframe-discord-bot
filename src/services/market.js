// warframe.market API client — prices, orders, items
// https://warframe.market/api_docs
// Rate limit: 3 req/sec

const V1_URL = 'https://api.warframe.market/v1';
const V2_URL = 'https://api.warframe.market/v2';
const ASSET_URL = 'https://warframe.market/static/assets';

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
  return getV2('/items');
}

export async function getItemDetail(slug) {
  return getV2(`/items/${encodeURIComponent(slug)}`);
}

export async function getOrders(slug) {
  return getV2(`/orders/item/${encodeURIComponent(slug)}`);
}

export async function getStatistics(urlName) {
  return getV1(`/items/${encodeURIComponent(urlName)}/statistics`);
}

export function assetUrl(path) {
  return `${ASSET_URL}/${path}`;
}
