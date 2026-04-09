import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags,
} from 'discord.js';
import { getRivenAttributes } from './riven.js';
import { assetUrl } from '../services/market.js';
import { cached } from '../services/cache.js';

const V1_URL = 'https://api.warframe.market/v1';
const TTL_LIST = 6 * 60 * 60 * 1000;
const TTL_SEARCH = 5 * 60 * 1000;

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

// ── Post the persistent button ──
export async function postRivenForm(channel) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search' })
    .setDescription(
      'Search for rivens on warframe.market\n\n' +
      '\u2022 Click below to search\n' +
      '\u2022 Type a weapon name and optional stat filter\n' +
      '\u2022 Results are shown only to you'
    )
    .setColor(0x9B59B6);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('riven_open')
      .setLabel('Search Rivens')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('\u{1F50D}')
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ── Button click → show modal ──
export async function handleRivenOpen(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('riven_submit')
    .setTitle('Riven Search');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('weapon')
        .setLabel('Weapon Name')
        .setPlaceholder('e.g. Braton, Gram, Rubico')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('positive')
        .setLabel('Desired Positive Stat (optional)')
        .setPlaceholder('e.g. critical chance, multishot, damage')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('negative')
        .setLabel('Acceptable Negative Stat (optional)')
        .setPlaceholder('e.g. damage to infested, zoom')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('max_price')
        .setLabel('Max Price in Platinum (optional)')
        .setPlaceholder('e.g. 500')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
  );

  await interaction.showModal(modal);
}

// ── Modal submitted → search and show results ──
export async function handleRivenSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  await ensureRivenData();

  const weaponQuery = interaction.fields.getTextInputValue('weapon');
  const positiveQuery = interaction.fields.getTextInputValue('positive') || null;
  const negativeQuery = interaction.fields.getTextInputValue('negative') || null;
  const maxPriceStr = interaction.fields.getTextInputValue('max_price') || null;
  const maxPrice = maxPriceStr ? parseInt(maxPriceStr) : null;

  // Fuzzy match weapon
  const lower = weaponQuery.toLowerCase();
  const weapon = allRivenItems.find(i => i.item_name.toLowerCase() === lower)
    || allRivenItems.find(i => i.item_name.toLowerCase().startsWith(lower))
    || allRivenItems.find(i => i.item_name.toLowerCase().includes(lower));

  if (!weapon) {
    return interaction.editReply({ content: `**${weaponQuery}** is not a riven-eligible weapon.` });
  }

  // Resolve stat names — supports comma-separated values
  const attributes = await getRivenAttributes();
  const resolveStat = (input) => {
    if (!input) return null;
    const l = input.toLowerCase().trim();
    // Also try with underscores for url_name format
    const u = l.replace(/\s+/g, '_');
    return (attributes.find(a => a.url_name === l || a.url_name === u)
      || attributes.find(a => a.effect?.toLowerCase() === l)
      || attributes.find(a => a.effect?.toLowerCase().startsWith(l))
      || attributes.find(a => a.url_name.startsWith(u)))?.url_name || null;
  };

  const resolveMultiple = (input) => {
    if (!input) return [];
    return input.split(',').map(s => resolveStat(s.trim())).filter(Boolean);
  };

  const positiveUrls = resolveMultiple(positiveQuery);
  const negativeUrls = resolveMultiple(negativeQuery);

  // Search auctions
  const params = new URLSearchParams({
    type: 'riven',
    weapon_url_name: weapon.url_name,
    sort_by: 'price_asc',
    buyout_policy: 'with',
  });
  for (const stat of positiveUrls) params.append('positive_stats', stat);
  for (const stat of negativeUrls) params.append('negative_stats', stat);

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

  // Filter — API only filters by first stat, enforce all locally
  let filtered = (auctions || []).filter(a => a.buyout_price && !a.closed);
  if (maxPrice && !isNaN(maxPrice)) filtered = filtered.filter(a => a.buyout_price <= maxPrice);

  // Ensure all requested positive stats are present as positives
  if (positiveUrls.length > 0) {
    filtered = filtered.filter(a => {
      const attrs = a.item?.attributes || [];
      return positiveUrls.every(stat =>
        attrs.some(attr => attr.url_name === stat && attr.positive)
      );
    });
  }
  // Ensure requested negative stats are present as negatives
  if (negativeUrls.length > 0) {
    filtered = filtered.filter(a => {
      const attrs = a.item?.attributes || [];
      return negativeUrls.every(stat =>
        attrs.some(attr => attr.url_name === stat && !attr.positive)
      );
    });
  }

  // Build result
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search Results' })
    .setTitle(`${weapon.item_name} Riven`)
    .setColor(0x9B59B6);

  if (weapon.thumb) embed.setThumbnail(assetUrl(weapon.thumb));

  const filters = [];
  if (positiveQuery) filters.push(`+${positiveQuery}`);
  if (negativeQuery) filters.push(`-${negativeQuery}`);
  if (maxPrice) filters.push(`\u2264${maxPrice}p`);
  const filterStr = filters.length > 0 ? `Filters: ${filters.join(' \u2022 ')}\n` : '';

  if (filtered.length === 0) {
    embed.setDescription(`${filterStr}No rivens found matching your criteria.`);
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
    embed.setDescription(
      `${filterStr}${filtered.length} listings \u2022 Buyouts from ${summary}\n\n` +
      lines.join('\n\n')
    );
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('riven_open')
      .setLabel('Search Again')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}
