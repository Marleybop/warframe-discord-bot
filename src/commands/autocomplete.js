import { getItemList } from '../services/market.js';

// In-memory filtered lists built from the cached market data
let marketItems = null;
let relicNames = null;

async function ensureItems() {
  if (marketItems) return;
  try {
    console.log('[autocomplete] Loading item list...');
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
    console.log(`[autocomplete] Ready: ${marketItems.length} items, ${relicNames.length} relics`);
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

export async function handleAutocomplete(interaction) {
  // Refresh in-memory list if it was cleared (e.g. after cache expiry)
  if (!marketItems) await ensureItems();

  const focused = interaction.options.getFocused(true);
  const query = focused.value;
  const command = interaction.commandName;

  const items = command === 'relic'
    ? (relicNames || [])
    : (marketItems || []);

  const choices = fuzzyFilter(items, query);
  await interaction.respond(choices);
}
