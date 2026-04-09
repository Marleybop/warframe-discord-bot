import { getItemList } from '../services/market.js';

// In-memory filtered lists built from the cached market data
let marketItems = null;
let relicNames = null;
let warframeNames = null;
let weaponNames = null;
let modNames = null;

async function ensureItems() {
  if (marketItems) return;
  try {
    console.log('[autocomplete] Loading item list...');
    const items = await getItemList();
    marketItems = items
      .filter(i => i.i18n?.en?.name)
      .map(i => {
        const name = i.i18n.en.name.slice(0, 100);
        const tags = i.tags || [];
        return { name, value: name, tags };
      });

    relicNames = marketItems.filter(i =>
      /^(Lith|Meso|Neo|Axi|Requiem)\s/i.test(i.name) && i.name.includes('Relic')
    );
    warframeNames = marketItems.filter(i =>
      i.tags.includes('warframe') && !i.name.includes('Blueprint') && !i.name.includes('Neuroptics')
      && !i.name.includes('Chassis') && !i.name.includes('Systems')
    );
    weaponNames = marketItems.filter(i =>
      (i.tags.includes('weapon') || i.tags.includes('primary') || i.tags.includes('secondary')
        || i.tags.includes('melee') || i.tags.includes('shotgun') || i.tags.includes('rifle'))
      && !i.name.includes('Blueprint') && !i.name.includes('Barrel')
      && !i.name.includes('Receiver') && !i.name.includes('Stock')
      && !i.name.includes('Blade') && !i.name.includes('Hilt')
    );
    modNames = marketItems.filter(i =>
      i.tags.includes('mod') || i.tags.includes('arcane')
    );

    console.log(`[autocomplete] Ready: ${marketItems.length} items, ${warframeNames.length} warframes, ${weaponNames.length} weapons, ${modNames.length} mods, ${relicNames.length} relics`);
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
