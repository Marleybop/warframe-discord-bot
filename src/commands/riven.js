import { EmbedBuilder } from 'discord.js';
import { assetUrl } from '../services/market.js';
import { e } from '../utils/emojis.js';
import { cached } from '../services/cache.js';

const V1_URL = 'https://api.warframe.market/v1';
const TTL_LIST = 6 * 60 * 60 * 1000;
const TTL_SEARCH = 5 * 60 * 1000;

async function getRivenItems() {
  return cached('riven:items', TTL_LIST, async () => {
    const res = await fetch(`${V1_URL}/riven/items`, { headers: { Platform: 'pc' } });
    if (!res.ok) throw new Error(`riven items ${res.status}`);
    const json = await res.json();
    return json.payload.items;
  });
}

export async function getRivenAttributes() {
  return cached('riven:attributes', TTL_LIST, async () => {
    const res = await fetch(`${V1_URL}/riven/attributes`, { headers: { Platform: 'pc' } });
    if (!res.ok) throw new Error(`riven attributes ${res.status}`);
    const json = await res.json();
    return json.payload.attributes;
  });
}

async function searchAuctions(urlName, opts = {}) {
  const params = new URLSearchParams({
    type: 'riven',
    weapon_url_name: urlName,
    sort_by: opts.sort || 'price_asc',
    buyout_policy: 'with',
  });
  if (opts.positive) params.append('positive_stats', opts.positive);
  if (opts.negative) params.append('negative_stats', opts.negative);

  const cacheKey = `riven:auctions:${urlName}:${params.toString()}`;
  return cached(cacheKey, TTL_SEARCH, async () => {
    const res = await fetch(`${V1_URL}/auctions/search?${params}`, { headers: { Platform: 'pc' } });
    if (!res.ok) throw new Error(`riven auctions ${res.status}`);
    const json = await res.json();
    return json.payload.auctions;
  });
}

export async function riven(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const query = interaction.options.getString('weapon');
  const positiveStat = interaction.options.getString('positive');
  const negativeStat = interaction.options.getString('negative');
  const maxPrice = interaction.options.getInteger('max_price');
  const maxRolls = interaction.options.getInteger('max_rolls');
  const sort = interaction.options.getString('sort') || 'price_asc';

  const items = await getRivenItems();
  if (!items) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription('Could not fetch riven data.')
        .setColor(0xFF0000)],
    });
  }

  // Find the weapon
  const lower = query.toLowerCase();
  const weapon = items.find(i => i.item_name.toLowerCase() === lower)
    || items.find(i => i.item_name.toLowerCase().startsWith(lower))
    || items.find(i => i.item_name.toLowerCase().includes(lower));

  if (!weapon) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`**${query}** is not a riven-eligible weapon.`)
        .setColor(0xFF0000)],
    });
  }

  // Resolve stat names to url_names if needed
  const attributes = await getRivenAttributes();
  const resolveStat = (input) => {
    if (!input) return null;
    const l = input.toLowerCase();
    const attr = attributes.find(a => a.url_name === l)
      || attributes.find(a => a.effect?.toLowerCase() === l)
      || attributes.find(a => a.effect?.toLowerCase().includes(l));
    return attr?.url_name || null;
  };

  const positiveUrl = resolveStat(positiveStat);
  const negativeUrl = resolveStat(negativeStat);

  // Fetch auctions
  let auctions;
  try {
    auctions = await searchAuctions(weapon.url_name, {
      sort,
      positive: positiveUrl,
      negative: negativeUrl,
    });
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Found **${weapon.item_name}** but couldn't fetch auctions.`)
        .setColor(0xFF0000)],
    });
  }

  // Apply local filters
  let filtered = (auctions || []).filter(a => a.buyout_price && !a.closed);
  if (maxPrice) filtered = filtered.filter(a => a.buyout_price <= maxPrice);
  if (maxRolls != null) filtered = filtered.filter(a => (a.item?.re_rolls || 0) <= maxRolls);

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Market' })
    .setTitle(`${weapon.item_name} Riven`)
    .setColor(0x9B59B6);

  if (weapon.thumb) embed.setThumbnail(assetUrl(weapon.thumb));

  // Build filter description
  const filters = [];
  if (positiveStat) filters.push(`+${positiveStat}`);
  if (negativeStat) filters.push(`-${negativeStat}`);
  if (maxPrice) filters.push(`\u2264${maxPrice}${e('platinum')}`);
  if (maxRolls != null) filters.push(`\u2264${maxRolls} rolls`);
  const filterStr = filters.length > 0 ? `Filters: ${filters.join(' \u2022 ')}\n` : '';

  if (filtered.length === 0) {
    embed.setDescription(`${filterStr}No rivens found matching your criteria.`);
    return interaction.editReply({ embeds: [embed] });
  }

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

    return `**${a.buyout_price}${e('platinum')}**${meta ? ` \u2022 ${meta}` : ''}\n\u2003${stats}\n\u2003Seller: ${seller}${status}`;
  });

  const prices = top.map(a => a.buyout_price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const summary = low === high ? `**${low}${e('platinum')}**` : `**${low}p** \u2013 **${high}${e('platinum')}**`;

  embed.setDescription(
    `${filterStr}${filtered.length} listings \u2022 Buyouts from ${summary}\n\n` +
    lines.join('\n\n')
  );

  await interaction.editReply({ embeds: [embed] });
}
