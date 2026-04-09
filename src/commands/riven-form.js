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

// In-memory riven items grouped by type
let rivensByGroup = null;

async function ensureRivenData() {
  if (rivensByGroup) return;
  const items = await cached('riven:items', TTL_LIST, async () => {
    const res = await fetch(`${V1_URL}/riven/items`, { headers: { Platform: 'pc' } });
    if (!res.ok) throw new Error(`riven items ${res.status}`);
    const json = await res.json();
    return json.payload.items;
  });
  rivensByGroup = {};
  for (const item of items) {
    const group = item.group || 'other';
    if (!rivensByGroup[group]) rivensByGroup[group] = [];
    rivensByGroup[group].push(item);
  }
  // Sort each group alphabetically
  for (const group of Object.values(rivensByGroup)) {
    group.sort((a, b) => a.item_name.localeCompare(b.item_name));
  }
}

// Ensure data is warm
ensureRivenData();

// Track active searches per user (userId → { weapon, positive, negative })
const activeSearches = new Map();

// ── Post the persistent entry point ──
export async function postRivenForm(channel) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search' })
    .setDescription(
      'Search for rivens on warframe.market\n\n' +
      '\u2022 Select a weapon category to start\n' +
      '\u2022 Narrow down by weapon and stats\n' +
      '\u2022 Results are shown only to you'
    )
    .setColor(0x9B59B6);

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_category')
      .setPlaceholder('Select weapon type...')
      .addOptions([
        { label: 'Rifle / Primary', value: 'rifle', emoji: '\u{1F52B}' },
        { label: 'Shotgun', value: 'shotgun', emoji: '\u{1F4A5}' },
        { label: 'Pistol / Secondary', value: 'pistol', emoji: '\u{1F52B}' },
        { label: 'Melee', value: 'melee', emoji: '\u2694\uFE0F' },
        { label: 'Kitgun', value: 'kitgun', emoji: '\u{1F527}' },
        { label: 'Zaw', value: 'zaw', emoji: '\u2694\uFE0F' },
        { label: 'Archgun', value: 'archgun', emoji: '\u{1F680}' },
      ])
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ── Step 1: Category selected → show weapon list ──
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

  // Discord select menus max 25 options — if more, split alphabetically
  const options = weapons.slice(0, 25).map(w => ({
    label: w.item_name,
    value: w.url_name,
  }));

  // Store search state
  activeSearches.set(interaction.user.id, { category });

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_weapon')
      .setPlaceholder('Select weapon...')
      .addOptions(options)
  );

  // If there are more than 25, add a second page
  const rows = [row];
  if (weapons.length > 25) {
    const options2 = weapons.slice(25, 50).map(w => ({
      label: w.item_name,
      value: w.url_name,
    }));
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('riven_weapon_2')
        .setPlaceholder('More weapons...')
        .addOptions(options2)
    ));
  }

  await interaction.reply({
    content: `**${category.charAt(0).toUpperCase() + category.slice(1)}** — Select a weapon:`,
    components: rows,
    flags: MessageFlags.Ephemeral,
  });
}

// ── Step 2: Weapon selected → show stat filter or search directly ──
export async function handleWeaponSelect(interaction) {
  await ensureRivenData();
  const weaponUrl = interaction.values[0];
  const search = activeSearches.get(interaction.user.id) || {};
  search.weaponUrl = weaponUrl;

  // Find weapon name
  for (const group of Object.values(rivensByGroup)) {
    const found = group.find(w => w.url_name === weaponUrl);
    if (found) { search.weaponName = found.item_name; search.thumb = found.thumb; break; }
  }

  activeSearches.set(interaction.user.id, search);

  // Offer to filter by stat or search now
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('riven_search_now')
      .setLabel('Search Now')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('riven_add_stat')
      .setLabel('Filter by Stat')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.update({
    content: `**${search.weaponName}** Riven — search now or add stat filters?`,
    components: [row],
  });
}

// ── Step 2b: Add stat filter ──
export async function handleAddStat(interaction) {
  const attributes = await getRivenAttributes();
  const common = attributes
    .filter(a => !a.search_only)
    .sort((a, b) => a.effect.localeCompare(b.effect))
    .slice(0, 25)
    .map(a => ({ label: a.effect, value: a.url_name }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_stat_positive')
      .setPlaceholder('Desired positive stat...')
      .addOptions(common)
  );

  await interaction.update({
    content: 'Select a **positive** stat to filter by:',
    components: [row],
  });
}

// ── Step 2c: Positive stat selected → search ──
export async function handleStatSelect(interaction) {
  const search = activeSearches.get(interaction.user.id) || {};
  search.positive = interaction.values[0];
  activeSearches.set(interaction.user.id, search);

  // Go straight to search
  return doSearch(interaction, search);
}

// ── Step 3: Execute search ──
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
    .setTitle(`${search.weaponName || search.weaponUrl} Riven`)
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

  // Clean up
  activeSearches.delete(interaction.user.id);

  // Add a "Search Again" button
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('riven_restart')
      .setLabel('Search Again')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({ content: '', embeds: [embed], components: [row] });
}

// ── Restart → show category selection again ──
export async function handleRestart(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_category')
      .setPlaceholder('Select weapon type...')
      .addOptions([
        { label: 'Rifle / Primary', value: 'rifle', emoji: '\u{1F52B}' },
        { label: 'Shotgun', value: 'shotgun', emoji: '\u{1F4A5}' },
        { label: 'Pistol / Secondary', value: 'pistol', emoji: '\u{1F52B}' },
        { label: 'Melee', value: 'melee', emoji: '\u2694\uFE0F' },
        { label: 'Kitgun', value: 'kitgun', emoji: '\u{1F527}' },
        { label: 'Zaw', value: 'zaw', emoji: '\u2694\uFE0F' },
        { label: 'Archgun', value: 'archgun', emoji: '\u{1F680}' },
      ])
  );

  await interaction.update({
    content: 'Select a weapon type:',
    embeds: [],
    components: [row],
  });
}
