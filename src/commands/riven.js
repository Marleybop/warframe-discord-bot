import { EmbedBuilder } from 'discord.js';
import { assetUrl } from '../services/market.js';
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

async function searchAuctions(urlName) {
  return cached(`riven:auctions:${urlName}`, TTL_SEARCH, async () => {
    const res = await fetch(
      `${V1_URL}/auctions/search?type=riven&weapon_url_name=${urlName}&sort_by=price_asc&buyout_policy=with`,
      { headers: { Platform: 'pc' } }
    );
    if (!res.ok) throw new Error(`riven auctions ${res.status}`);
    const json = await res.json();
    return json.payload.auctions;
  });
}

function formatStats(stats) {
  return stats.map(s => {
    const sign = s.positive ? '+' : '';
    const val = s.value > 0 ? `+${s.value}` : `${s.value}`;
    return `${val}${s.units === 'percent' ? '%' : ''} ${s.effect || s.url_name}`;
  }).join('\n');
}

export async function riven(interaction) {
  await interaction.deferReply();

  const query = interaction.options.getString('weapon');

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

  // Fetch live auctions
  let auctions;
  try {
    auctions = await searchAuctions(weapon.url_name);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Found **${weapon.item_name}** but couldn't fetch auctions.`)
        .setColor(0xFF0000)],
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Market' })
    .setTitle(`${weapon.item_name} Riven`)
    .setColor(0x9B59B6);

  if (weapon.thumb) embed.setThumbnail(assetUrl(weapon.thumb));

  if (!auctions || auctions.length === 0) {
    embed.setDescription('No rivens currently listed for sale.');
    return interaction.editReply({ embeds: [embed] });
  }

  // Show cheapest buyout listings
  const buyouts = auctions
    .filter(a => a.buyout_price && !a.closed)
    .sort((a, b) => a.buyout_price - b.buyout_price)
    .slice(0, 5);

  if (buyouts.length === 0) {
    embed.setDescription(`${auctions.length} auctions found but none with buyout prices.`);
    return interaction.editReply({ embeds: [embed] });
  }

  const lines = buyouts.map(a => {
    const stats = (a.item?.attributes || []).map(s => {
      const val = s.value > 0 ? `+${s.value}` : `${s.value}`;
      return `${val}% ${s.url_name.replace(/_/g, ' ')}`;
    }).join(', ');

    const rerolls = a.item?.re_rolls != null ? ` \u2022 ${a.item.re_rolls} rolls` : '';
    const mr = a.item?.mastery_level ? ` \u2022 MR ${a.item.mastery_level}` : '';
    const seller = a.owner?.ingame_name || '?';
    const status = a.owner?.status === 'ingame' ? ' \u{1F7E2}' : '';

    return `**${a.buyout_price}p**${mr}${rerolls}\n\u2003${stats}\n\u2003Seller: ${seller}${status}`;
  });

  // Price range summary
  const prices = buyouts.map(a => a.buyout_price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const summary = low === high ? `**${low}p**` : `**${low}p** \u2013 **${high}p**`;

  embed.setDescription(
    `${auctions.length} listings \u2022 Buyouts from ${summary}\n\n` +
    lines.join('\n\n')
  );

  await interaction.editReply({ embeds: [embed] });
}
