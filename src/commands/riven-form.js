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
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let allRivenItems = null;

async function ensureRivenData() {
  if (allRivenItems) return;
  allRivenItems = await cached('riven:items', TTL_LIST, async () => {
    const res = await fetch(`${V1_URL}/riven/items`, { headers: { Platform: 'pc' } });
    if (!res.ok) throw new Error(`riven items ${res.status}`);
    const json = await res.json();
    return json.payload.items.sort((a, b) => a.item_name.localeCompare(b.item_name));
  });
}

ensureRivenData();

// Track active searches per user
const activeSearches = new Map();

// ── Post the persistent entry point ──
export async function postRivenForm(channel) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search' })
    .setDescription(
      'Search for rivens on warframe.market\n\n' +
      '\u2022 Pick a letter range to find your weapon\n' +
      '\u2022 Filter by stats if you want\n' +
      '\u2022 Results are shown only to you'
    )
    .setColor(0x9B59B6);

  // Split alphabet into ranges for the first selector
  const ranges = [
    { label: 'A – D', value: 'A-D' },
    { label: 'E – H', value: 'E-H' },
    { label: 'I – L', value: 'I-L' },
    { label: 'M – P', value: 'M-P' },
    { label: 'Q – T', value: 'Q-T' },
    { label: 'U – Z', value: 'U-Z' },
  ];

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_alpha')
      .setPlaceholder('Select letter range to find weapon...')
      .addOptions(ranges)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ── Step 1: Letter range selected → show weapons in that range ──
export async function handleAlphaSelect(interaction) {
  await ensureRivenData();
  const range = interaction.values[0]; // e.g. "A-D"
  const [start, end] = range.split('-');

  const filtered = allRivenItems.filter(w => {
    const first = w.item_name[0].toUpperCase();
    return first >= start && first <= end;
  });

  if (filtered.length === 0) {
    return interaction.reply({
      content: `No weapons found in range **${range}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Discord max 25 options per select
  const options = filtered.slice(0, 25).map(w => ({
    label: w.item_name,
    value: w.url_name,
  }));

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('riven_weapon')
        .setPlaceholder('Select weapon...')
        .addOptions(options)
    ),
  ];

  // Second page if needed
  if (filtered.length > 25) {
    const options2 = filtered.slice(25, 50).map(w => ({
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
    content: `**${range}** — Select a weapon:`,
    components: rows,
    flags: MessageFlags.Ephemeral,
  });
}

// ── Step 2: Weapon selected → offer search or filter ──
export async function handleWeaponSelect(interaction) {
  await ensureRivenData();
  const weaponUrl = interaction.values[0];
  const weapon = allRivenItems.find(w => w.url_name === weaponUrl);

  const search = {
    weaponUrl,
    weaponName: weapon?.item_name || weaponUrl,
    thumb: weapon?.thumb,
  };
  activeSearches.set(interaction.user.id, search);

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
    content: `**${search.weaponName}** Riven — search all or filter by stat?`,
    components: [row],
  });
}

// ── Step 2b: Add stat filter ──
export async function handleAddStat(interaction) {
  const attributes = await getRivenAttributes();

  // Show the most popular/useful stats
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
    new ButtonBuilder()
      .setCustomId('riven_restart')
      .setLabel('Search Again')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({ content: '', embeds: [embed], components: [row] });
}

// ── Restart ──
export async function handleRestart(interaction) {
  const ranges = [
    { label: 'A – D', value: 'A-D' },
    { label: 'E – H', value: 'E-H' },
    { label: 'I – L', value: 'I-L' },
    { label: 'M – P', value: 'M-P' },
    { label: 'Q – T', value: 'Q-T' },
    { label: 'U – Z', value: 'U-Z' },
  ];

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('riven_alpha')
      .setPlaceholder('Select letter range to find weapon...')
      .addOptions(ranges)
  );

  await interaction.update({
    content: 'Select a letter range to find your weapon:',
    embeds: [],
    components: [row],
  });
}
