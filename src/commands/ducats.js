import { EmbedBuilder } from 'discord.js';
import { getItemList, getStatistics, assetUrl } from '../services/market.js';

export async function ducats(interaction) {
  await interaction.deferReply();

  const query = interaction.options.getString('item');

  const items = await getItemList();
  if (!items) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription('Could not fetch item data.')
        .setColor(0xFF0000)],
    });
  }

  // If no query, show best ducat/plat ratio items
  if (!query) {
    const ducatItems = items
      .filter(i => i.ducats && i.ducats > 0 && i.i18n?.en?.name)
      .map(i => ({
        name: i.i18n.en.name,
        ducats: i.ducats,
        slug: i.slug,
      }))
      .sort((a, b) => b.ducats - a.ducats)
      .slice(0, 20);

    const lines = ducatItems.map(i =>
      `**${i.name}** \u2022 ${i.ducats} ducats`
    );

    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Ducat Values' })
        .setTitle('Top 20 by Ducat Value')
        .setDescription(lines.join('\n'))
        .setColor(0xDAA520)],
    });
  }

  // Search for specific item
  const lower = query.toLowerCase();
  const match = items.find(i => i.i18n?.en?.name?.toLowerCase() === lower)
    || items.find(i => i.i18n?.en?.name?.toLowerCase().startsWith(lower))
    || items.find(i => i.i18n?.en?.name?.toLowerCase().includes(lower));

  if (!match) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No item found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  const name = match.i18n?.en?.name || match.slug;
  const ducatVal = match.ducats;

  if (!ducatVal) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`**${name}** has no ducat value (not a Prime part).`)
        .setColor(0x808080)],
    });
  }

  // Try to get market price for ducat/plat ratio
  let priceInfo = '';
  try {
    const stats = await getStatistics(match.slug);
    const recent = stats.statistics_closed?.['48hours'];
    const last = recent?.[recent.length - 1];
    if (last?.median) {
      const ratio = (ducatVal / last.median).toFixed(1);
      priceInfo = `\nMarket Price: **${last.median}p** \u2022 Ratio: **${ratio} ducats/p**`;
    }
  } catch { /* optional */ }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Ducat Value' })
    .setTitle(name)
    .setDescription(`**${ducatVal}** ducats${priceInfo}`)
    .setColor(0xDAA520);

  const thumb = match.i18n?.en?.thumb;
  if (thumb) embed.setThumbnail(assetUrl(thumb));

  await interaction.editReply({ embeds: [embed] });
}
