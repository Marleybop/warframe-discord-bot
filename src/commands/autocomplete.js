import { getItemList } from '../services/market.js';
import { cached } from '../services/cache.js';

const WFSTAT_URL = 'https://api.warframestat.us';
const TTL = 6 * 60 * 60 * 1000; // 6 hours

// In-memory filtered lists
let marketItems = null;
let relicNames = null;
let primePartNames = null;
let rivenWeaponNames = null;
let warframeNames = null;
let weaponNames = null;
let modNames = null;

async function fetchNameList(endpoint) {
  const res = await fetch(`${WFSTAT_URL}/${endpoint}/`);
  if (!res.ok) throw new Error(`${endpoint} ${res.status}`);
  const data = await res.json();
  // Extract top-level item names (filter out nested components, patchlogs, etc.)
  const seen = new Set();
  return data
    .filter(item => {
      if (!item.name || !item.category) return false;
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    })
    .map(item => ({ name: item.name.slice(0, 100), value: item.name.slice(0, 100) }));
}

async function ensureItems() {
  if (marketItems) return;
  try {
    console.log('[autocomplete] Loading item lists...');

    // Load warframe.market items for /price and /where
    const items = await getItemList();
    marketItems = items
      .filter(i => i.i18n?.en?.name)
      .map(i => {
        const name = i.i18n.en.name.slice(0, 100);
        return { name, value: name };
      });

    relicNames = marketItems.filter(i =>
      /^(Lith|Meso|Neo|Axi|Requiem)\s/i.test(i.name) && i.name.includes('Relic')
    );

    primePartNames = items
      .filter(i => i.i18n?.en?.name && i.ducats && i.ducats > 0 && i.tags?.includes('prime'))
      .map(i => ({ name: i.i18n.en.name.slice(0, 100), value: i.i18n.en.name.slice(0, 100) }));

    // Load riven-eligible weapons from warframe.market
    rivenWeaponNames = await cached('autocomplete:rivens', TTL, async () => {
      const res = await fetch('https://api.warframe.market/v1/riven/items', { headers: { Platform: 'pc' } });
      if (!res.ok) throw new Error(`riven items ${res.status}`);
      const json = await res.json();
      return json.payload.items.map(i => ({ name: i.item_name.slice(0, 100), value: i.item_name.slice(0, 100) }));
    });

    // Load warframestat.us lists for /warframe, /weapon, /mod (has ALL items, not just tradeable)
    warframeNames = await cached('autocomplete:warframes', TTL, () => fetchNameList('warframes'));
    weaponNames = await cached('autocomplete:weapons', TTL, () => fetchNameList('weapons'));
    modNames = await cached('autocomplete:mods', TTL, () => fetchNameList('mods'));

    console.log(`[autocomplete] Ready: ${marketItems.length} market, ${warframeNames.length} warframes, ${weaponNames.length} weapons, ${modNames.length} mods, ${relicNames.length} relics, ${rivenWeaponNames.length} riven weapons`);
  } catch (err) {
    console.error('[autocomplete] Failed to load items:', err.message);
  }
}

// Pre-warm on import
ensureItems();

function fuzzyFilter(items, query, limit = 25) {
  if (!query) return items.slice(0, limit);
  const lower = query.toLowerCase();
  const exact = [];
  const startsWith = [];
  const contains = [];

  for (const item of items) {
    const name = item.name.toLowerCase();
    if (name === lower) { exact.push(item); continue; }
    if (name.startsWith(lower)) { startsWith.push(item); continue; }
    if (name.includes(lower)) contains.push(item);
  }

  return [...exact, ...startsWith, ...contains].slice(0, limit);
}

const COMMAND_LISTS = {
  relic: () => relicNames || [],
  warframe: () => warframeNames || [],
  weapon: () => weaponNames || [],
  mod: () => modNames || [],
  ducats: () => primePartNames || [],
  riven: () => rivenWeaponNames || [],
};

export async function handleAutocomplete(interaction) {
  if (!marketItems) await ensureItems();

  const focused = interaction.options.getFocused(true);
  const query = focused.value;
  const command = interaction.commandName;

  const getList = COMMAND_LISTS[command];
  const items = getList ? getList() : (marketItems || []);

  const choices = fuzzyFilter(items, query);
  await interaction.respond(choices);
}
