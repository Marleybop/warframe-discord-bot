import { getItemList } from '../services/market.js';

// Cached item lists
let marketItems = null;
let marketItemsTime = 0;
let relicNames = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getMarketItems() {
  if (marketItems && Date.now() - marketItemsTime < CACHE_TTL) return marketItems;
  try {
    const items = await getItemList();
    marketItems = items.map(i => ({
      name: i.i18n?.en?.name || i.slug,
      value: i.i18n?.en?.name || i.slug,
    }));
    // Extract relic names from market items
    relicNames = marketItems.filter(i =>
      /^(Lith|Meso|Neo|Axi|Requiem)\s/i.test(i.name) && i.name.includes('Relic')
    );
    marketItemsTime = Date.now();
  } catch {
    // Keep stale cache on failure
  }
  return marketItems || [];
}

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

export async function handleAutocomplete(interaction) {
  const focused = interaction.options.getFocused(true);
  const query = focused.value;
  const command = interaction.commandName;

  await getMarketItems(); // ensure cache is warm

  let choices;
  if (command === 'relic') {
    choices = fuzzyFilter(relicNames || [], query);
  } else {
    choices = fuzzyFilter(marketItems || [], query);
  }

  await interaction.respond(choices);
}
