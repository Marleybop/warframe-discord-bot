import { EmbedBuilder } from 'discord.js';
import { getItemList, getStatistics, assetUrl } from '../services/market.js';

// Cache the item list so we don't fetch it every command
let itemCache = null;
let itemCacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getItems() {
  if (itemCache && Date.now() - itemCacheTime < CACHE_TTL) return itemCache;
  itemCache = await getItemList();
  itemCacheTime = Date.now();
  return itemCache;
}

function fuzzyMatch(items, query) {
  const lower = query.toLowerCase();
  // Exact match first
  const exact = items.find(i => i.i18n?.en?.name?.toLowerCase() === lower);
  if (exact) return exact;
  // Starts with
  const starts = items.find(i => i.i18n?.en?.name?.toLowerCase().startsWith(lower));
  if (starts) return starts;
  // Contains
  return items.find(i => i.i18n?.en?.name?.toLowerCase().includes(lower));
}

export async function price(interaction) {
  await interaction.deferReply();

  const query = interaction.options.getString('item');
  const items = await getItems();
  const item = fuzzyMatch(items, query);

  if (!item) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No item found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  const name = item.i18n?.en?.name || item.slug;
  const urlName = item.slug;

  // Fetch price stats
  let stats;
  try {
    stats = await getStatistics(urlName);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Found **${name}** but couldn't fetch price data.`)
        .setColor(0xFF0000)],
    });
  }

  const closed48 = stats.statistics_closed?.['48hours'] || [];
  const closed90 = stats.statistics_closed?.['90days'] || [];

  // Get the most recent 48h data point
  const recent = closed48[closed48.length - 1];
  // Get 90-day summary (last entry)
  const longTerm = closed90[closed90.length - 1];

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'warframe.market' })
    .setTitle(name)
    .setURL(`https://warframe.market/items/${urlName}`)
    .setColor(0x4A90D9);

  let desc = '';

  if (recent) {
    desc += '**Last 48 Hours**\n';
    desc += `Median: **${recent.median}p** \u2022 Avg: **${Math.round(recent.avg_price)}p**\n`;
    desc += `Range: ${recent.min_price}p \u2013 ${recent.max_price}p \u2022 Vol: ${recent.volume}\n`;
  }

  if (longTerm) {
    desc += '\n**Last 90 Days**\n';
    desc += `Median: **${longTerm.median}p** \u2022 Avg: **${Math.round(longTerm.avg_price)}p**\n`;
    desc += `Range: ${longTerm.min_price}p \u2013 ${longTerm.max_price}p \u2022 Vol: ${longTerm.volume}\n`;
  }

  if (!recent && !longTerm) {
    desc = 'No recent price data available.';
  }

  embed.setDescription(desc);

  // Add item thumbnail if available
  const thumb = item.i18n?.en?.thumb;
  if (thumb) embed.setThumbnail(assetUrl(thumb));

  await interaction.editReply({ embeds: [embed] });
}
