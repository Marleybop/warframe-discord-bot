import { EmbedBuilder } from 'discord.js';
import { getItemList, getStatistics, assetUrl } from '../services/market.js';

function fuzzyMatch(items, query) {
  const lower = query.toLowerCase();
  return items.find(i => i.i18n?.en?.name?.toLowerCase() === lower)
    || items.find(i => i.i18n?.en?.name?.toLowerCase().startsWith(lower))
    || items.find(i => i.i18n?.en?.name?.toLowerCase().includes(lower));
}

function formatStats(stats) {
  const closed48 = stats.statistics_closed?.['48hours'] || [];
  const closed90 = stats.statistics_closed?.['90days'] || [];
  const recent = closed48[closed48.length - 1];
  const longTerm = closed90[closed90.length - 1];

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
  return { desc, median48: recent?.median, median90: longTerm?.median };
}

export async function price(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const query = interaction.options.getString('item');
  const items = await getItemList();
  const item = fuzzyMatch(items, query);

  if (!item) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No item found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  const name = item.i18n?.en?.name || item.slug;
  const isSet = item.tags?.includes('set');

  // Fetch set price stats
  let stats;
  try {
    stats = await getStatistics(item.slug);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Found **${name}** but couldn't fetch price data.`)
        .setColor(0xFF0000)],
    });
  }

  const { desc: setDesc } = formatStats(stats);

  let desc = setDesc || 'No recent price data available.';

  // If it's a set, also show individual part prices
  if (isSet && item.setParts?.length > 0) {
    const partPrices = await Promise.all(
      item.setParts.map(async (partId) => {
        const part = items.find(i => i.id === partId);
        if (!part) return null;
        const partName = part.i18n?.en?.name || part.slug;
        try {
          const partStats = await getStatistics(part.slug);
          const recent = partStats.statistics_closed?.['48hours'] || [];
          const last = recent[recent.length - 1];
          return { name: partName, median: last?.median || null };
        } catch {
          return { name: partName, median: null };
        }
      })
    );

    const validParts = partPrices.filter(p => p && p.median);
    if (validParts.length > 0) {
      desc += '\n__Individual Parts__\n';
      desc += validParts.map(p => `${p.name} \u2022 **${p.median}p**`).join('\n');
    }
  } else if (isSet) {
    // setParts not available, try finding parts by name
    const baseName = name.toLowerCase().replace(' set', '').trim();
    const parts = items.filter(i => {
      const n = i.i18n?.en?.name?.toLowerCase() || '';
      return n.startsWith(baseName) && !n.includes(' set') && n !== baseName;
    });

    if (parts.length > 0) {
      const partPrices = await Promise.all(
        parts.slice(0, 8).map(async (part) => {
          const partName = part.i18n?.en?.name || part.slug;
          try {
            const partStats = await getStatistics(part.slug);
            const recent = partStats.statistics_closed?.['48hours'] || [];
            const last = recent[recent.length - 1];
            return { name: partName, median: last?.median || null };
          } catch {
            return { name: partName, median: null };
          }
        })
      );

      const validParts = partPrices.filter(p => p && p.median);
      if (validParts.length > 0) {
        desc += '\n__Individual Parts__\n';
        desc += validParts.map(p => `${p.name} \u2022 **${p.median}p**`).join('\n');
      }
    }
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'warframe.market' })
    .setTitle(name)
    .setURL(`https://warframe.market/items/${item.slug}`)
    .setDescription(desc)
    .setColor(0x4A90D9);

  const thumb = item.i18n?.en?.thumb;
  if (thumb) embed.setThumbnail(assetUrl(thumb));

  await interaction.editReply({ embeds: [embed] });
}
