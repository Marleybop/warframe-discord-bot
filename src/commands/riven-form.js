import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, MessageFlags,
} from 'discord.js';
import { getRivenAttributes } from './riven.js';
import { assetUrl } from '../services/market.js';
import { cached } from '../services/cache.js';

const V1_URL = 'https://api.warframe.market/v1';
const TTL_LIST = 6 * 60 * 60 * 1000;
const TTL_SEARCH = 5 * 60 * 1000;

let rivensByGroup = null;

async function ensureRivenData() {
  if (rivensByGroup) return;
  const items = await cached('riven:items', TTL_LIST, async () => {
    const res = await fetch(`${V1_URL}/riven/items`, { headers: { Platform: 'pc' } });
    if (!res.ok) throw new Error(`riven items ${res.status}`);
    const json = await res.json();
    return json.payload.items.sort((a, b) => a.item_name.localeCompare(b.item_name));
  });
  rivensByGroup = {};
  for (const item of items) {
    const group = item.group || 'other';
    if (!rivensByGroup[group]) rivensByGroup[group] = [];
    rivensByGroup[group].push(item);
  }
}

ensureRivenData();

const activeSearches = new Map();

const CATEGORIES = [
  { label: 'Primary', value: 'primary', emoji: '\u{1F52B}' },
  { label: 'Secondary', value: 'secondary', emoji: '\u{1F52B}' },
  { label: 'Melee', value: 'melee', emoji: '\u2694\uFE0F' },
  { label: 'Kitgun', value: 'kitgun', emoji: '\u{1F527}' },
  { label: 'Zaw', value: 'zaw', emoji: '\u2694\uFE0F' },
  { label: 'Archgun', value: 'archgun', emoji: '\u{1F680}' },
  { label: 'Sentinel', value: 'sentinel', emoji: '\u{1F916}' },
];

function buildCategorySelect() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_category')
      .setPlaceholder('Select weapon type...')
      .addOptions(CATEGORIES)
  );
}

// ── Post the persistent entry point ──
export async function postRivenForm(channel) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search' })
    .setDescription(
      'Search for rivens on warframe.market\n\n' +
      '\u2022 Select weapon type \u2192 weapon \u2192 stats\n' +
      '\u2022 Results are shown only to you'
    )
    .setColor(0x9B59B6);

  await channel.send({ embeds: [embed], components: [buildCategorySelect()] });
}

// ── Step 1: Category selected → show weapons ──
export async function handleCategorySelect(interaction) {
  await ensureRivenData();
  const category = interaction.values[0];
  const weapons = rivensByGroup[category] || [];

  if (weapons.length === 0) {
    return interaction.reply({
      content: `No riven-eligible weapons found for **${category}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const search = { category };
  activeSearches.set(interaction.user.id, search);

  // If more than 25 weapons, split alphabetically into pages
  if (weapons.length <= 25) {
    const options = weapons.map(w => ({ label: w.item_name, value: w.url_name }));
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('riven_weapon')
        .setPlaceholder('Select weapon...')
        .addOptions(options)
    );
    return interaction.reply({
      content: `**${category.charAt(0).toUpperCase() + category.slice(1)}** \u2014 Select weapon:`,
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Split into A-M and N-Z pages
  const firstHalf = weapons.filter(w => w.item_name[0].toUpperCase() <= 'M');
  const secondHalf = weapons.filter(w => w.item_name[0].toUpperCase() > 'M');

  const rows = [];
  if (firstHalf.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('riven_weapon')
        .setPlaceholder(`A – M (${firstHalf.length} weapons)`)
        .addOptions(firstHalf.slice(0, 25).map(w => ({ label: w.item_name, value: w.url_name })))
    ));
  }
  if (secondHalf.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('riven_weapon_2')
        .setPlaceholder(`N – Z (${secondHalf.length} weapons)`)
        .addOptions(secondHalf.slice(0, 25).map(w => ({ label: w.item_name, value: w.url_name })))
    ));
  }

  // If either half exceeds 25, add page buttons
  const needsPaging = firstHalf.length > 25 || secondHalf.length > 25;
  if (needsPaging) {
    // Store full list for paging
    search.allWeapons = weapons;
    search.page = 0;
    activeSearches.set(interaction.user.id, search);

    const page = weapons.slice(0, 25);
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('riven_weapon')
        .setPlaceholder(`Page 1 — ${page[0].item_name} to ${page[page.length - 1].item_name}`)
        .addOptions(page.map(w => ({ label: w.item_name, value: w.url_name })))
    );
    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('riven_page_next')
        .setLabel('Next Page \u25B6')
        .setStyle(ButtonStyle.Secondary),
    );
    return interaction.reply({
      content: `**${category.charAt(0).toUpperCase() + category.slice(1)}** \u2014 ${weapons.length} weapons (page 1):`,
      components: [row, navRow],
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.reply({
    content: `**${category.charAt(0).toUpperCase() + category.slice(1)}** \u2014 ${weapons.length} weapons:`,
    components: rows,
    flags: MessageFlags.Ephemeral,
  });
}

// ── Page navigation ──
export async function handlePageNext(interaction) {
  const search = activeSearches.get(interaction.user.id);
  if (!search?.allWeapons) return interaction.update({ content: 'Session expired. Start over.', components: [] });

  search.page = (search.page || 0) + 1;
  const start = search.page * 25;
  const page = search.allWeapons.slice(start, start + 25);

  if (page.length === 0) {
    search.page = 0;
    const first = search.allWeapons.slice(0, 25);
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('riven_weapon')
        .setPlaceholder(`Page 1 — ${first[0].item_name} to ${first[first.length - 1].item_name}`)
        .addOptions(first.map(w => ({ label: w.item_name, value: w.url_name })))
    );
    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('riven_page_next').setLabel('Next Page \u25B6').setStyle(ButtonStyle.Secondary),
    );
    return interaction.update({ content: `Page 1 of ${Math.ceil(search.allWeapons.length / 25)}:`, components: [row, navRow] });
  }

  activeSearches.set(interaction.user.id, search);

  const totalPages = Math.ceil(search.allWeapons.length / 25);
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_weapon')
      .setPlaceholder(`Page ${search.page + 1} — ${page[0].item_name} to ${page[page.length - 1].item_name}`)
      .addOptions(page.map(w => ({ label: w.item_name, value: w.url_name })))
  );
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('riven_page_prev').setLabel('\u25C0 Prev').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('riven_page_next').setLabel('Next \u25B6').setStyle(ButtonStyle.Secondary),
  );

  await interaction.update({ content: `Page ${search.page + 1} of ${totalPages}:`, components: [row, navRow] });
}

export async function handlePagePrev(interaction) {
  const search = activeSearches.get(interaction.user.id);
  if (!search?.allWeapons) return interaction.update({ content: 'Session expired. Start over.', components: [] });

  search.page = Math.max(0, (search.page || 0) - 1);
  activeSearches.set(interaction.user.id, search);

  const start = search.page * 25;
  const page = search.allWeapons.slice(start, start + 25);
  const totalPages = Math.ceil(search.allWeapons.length / 25);

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_weapon')
      .setPlaceholder(`Page ${search.page + 1} — ${page[0].item_name} to ${page[page.length - 1].item_name}`)
      .addOptions(page.map(w => ({ label: w.item_name, value: w.url_name })))
  );

  const navButtons = [];
  if (search.page > 0) navButtons.push(new ButtonBuilder().setCustomId('riven_page_prev').setLabel('\u25C0 Prev').setStyle(ButtonStyle.Secondary));
  navButtons.push(new ButtonBuilder().setCustomId('riven_page_next').setLabel('Next \u25B6').setStyle(ButtonStyle.Secondary));
  const navRow = new ActionRowBuilder().addComponents(...navButtons);

  await interaction.update({ content: `Page ${search.page + 1} of ${totalPages}:`, components: [row, navRow] });
}

// ── Step 2: Weapon selected → offer search or filter ──
export async function handleWeaponSelect(interaction) {
  await ensureRivenData();
  const weaponUrl = interaction.values[0];

  let weapon;
  for (const group of Object.values(rivensByGroup)) {
    weapon = group.find(w => w.url_name === weaponUrl);
    if (weapon) break;
  }

  const search = activeSearches.get(interaction.user.id) || {};
  search.weaponUrl = weaponUrl;
  search.weaponName = weapon?.item_name || weaponUrl;
  search.thumb = weapon?.thumb;
  delete search.allWeapons; // clean up paging data
  activeSearches.set(interaction.user.id, search);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('riven_search_now').setLabel('Search Now').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('riven_add_stat').setLabel('Filter by Stat').setStyle(ButtonStyle.Secondary),
  );

  await interaction.update({
    content: `**${search.weaponName}** Riven \u2014 search all or filter by stat?`,
    components: [row],
  });
}

// ── Step 2b: Add stat filter ──
export async function handleAddStat(interaction) {
  const attributes = await getRivenAttributes();

  const popular = [
    'critical_chance', 'critical_damage', 'base_damage_/_melee_damage',
    'multishot', 'damage', 'toxin_damage', 'heat_damage', 'cold_damage',
    'electricity_damage', 'attack_speed', 'fire_rate_/_attack_speed',
    'status_chance', 'status_duration', 'punch_through',
    'reload_speed', 'magazine_capacity', 'range',
  ];

  const options = popular
    .map(url => {
      const attr = attributes.find(a => a.url_name === url);
      return attr ? { label: attr.effect, value: attr.url_name } : null;
    })
    .filter(Boolean)
    .slice(0, 25);

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_stat_positive')
      .setPlaceholder('Select desired positive stat...')
      .addOptions(options)
  );

  await interaction.update({ content: 'Select a **positive** stat to filter by:', components: [row] });
}

// ── Step 2c: Stat selected → search ──
export async function handleStatSelect(interaction) {
  const search = activeSearches.get(interaction.user.id) || {};
  search.positive = interaction.values[0];
  activeSearches.set(interaction.user.id, search);
  return doSearch(interaction, search);
}

// ── Step 3: Search now ──
export async function handleSearchNow(interaction) {
  const search = activeSearches.get(interaction.user.id) || {};
  return doSearch(interaction, search);
}

async function doSearch(interaction, search) {
  if (!search.weaponUrl) {
    return interaction.update({ content: 'Something went wrong. Start over.', components: [] });
  }

  await interaction.update({ content: 'Searching...', components: [] });

  const params = new URLSearchParams({
    type: 'riven',
    weapon_url_name: search.weaponUrl,
    sort_by: 'price_asc',
    buyout_policy: 'with',
  });
  if (search.positive) params.append('positive_stats', search.positive);

  let auctions;
  try {
    const cacheKey = `riven:form:${params.toString()}`;
    auctions = await cached(cacheKey, TTL_SEARCH, async () => {
      const res = await fetch(`${V1_URL}/auctions/search?${params}`, { headers: { Platform: 'pc' } });
      if (!res.ok) throw new Error(`auctions ${res.status}`);
      const json = await res.json();
      return json.payload.auctions;
    });
  } catch {
    return interaction.editReply({ content: 'Failed to search auctions. Try again.' });
  }

  const filtered = (auctions || []).filter(a => a.buyout_price && !a.closed);

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search Results' })
    .setTitle(`${search.weaponName} Riven`)
    .setColor(0x9B59B6);

  if (search.thumb) embed.setThumbnail(assetUrl(search.thumb));

  if (filtered.length === 0) {
    embed.setDescription('No rivens found matching your criteria.');
  } else {
    const top = filtered.slice(0, 5);
    const lines = top.map(a => {
      const stats = (a.item?.attributes || []).map(s => {
        const val = s.value > 0 ? `+${s.value}` : `${s.value}`;
        return `${val}% ${s.url_name.replace(/_/g, ' ')}`;
      }).join(', ');
      const rerolls = a.item?.re_rolls != null ? `${a.item.re_rolls} rolls` : '';
      const mr = a.item?.mastery_level ? `MR ${a.item.mastery_level}` : '';
      const meta = [mr, rerolls].filter(Boolean).join(' \u2022 ');
      const seller = a.owner?.ingame_name || '?';
      const status = a.owner?.status === 'ingame' ? ' \u{1F7E2}' : '';
      return `**${a.buyout_price}p**${meta ? ` \u2022 ${meta}` : ''}\n\u2003${stats}\n\u2003Seller: ${seller}${status}`;
    });

    const prices = top.map(a => a.buyout_price);
    const summary = `**${Math.min(...prices)}p** \u2013 **${Math.max(...prices)}p**`;
    let desc = `${filtered.length} listings \u2022 Buyouts from ${summary}\n\n`;
    if (search.positive) {
      const attributes = await getRivenAttributes();
      const attr = attributes.find(a => a.url_name === search.positive);
      desc = `Filter: +${attr?.effect || search.positive}\n${desc}`;
    }
    desc += lines.join('\n\n');
    embed.setDescription(desc);
  }

  activeSearches.delete(interaction.user.id);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('riven_restart').setLabel('Search Again').setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({ content: '', embeds: [embed], components: [row] });
}

// ── Restart ──
export async function handleRestart(interaction) {
  await interaction.update({
    content: 'Select a weapon type:',
    embeds: [],
    components: [buildCategorySelect()],
  });
}
