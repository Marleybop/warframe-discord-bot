import { EmbedBuilder } from 'discord.js';
import { getItemList, assetUrl } from '../services/market.js';

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

  // Only Prime parts have ducat values
  const primeItems = items.filter(i =>
    i.ducats && i.ducats > 0 && i.i18n?.en?.name
    && i.tags?.includes('prime')
  );

  // If no query, show top ducat value items
  if (!query) {
    const sorted = primeItems
      .map(i => ({ name: i.i18n.en.name, ducats: i.ducats }))
      .sort((a, b) => b.ducats - a.ducats)
      .slice(0, 20);

    const lines = sorted.map(i => `**${i.name}** \u2022 ${i.ducats} ducats`);

    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Ducat Values' })
        .setTitle('Top 20 Prime Parts by Ducat Value')
        .setDescription(lines.join('\n'))
        .setColor(0xDAA520)],
    });
  }

  // Search for specific item
  const lower = query.toLowerCase();
  const match = primeItems.find(i => i.i18n.en.name.toLowerCase() === lower)
    || primeItems.find(i => i.i18n.en.name.toLowerCase().startsWith(lower))
    || primeItems.find(i => i.i18n.en.name.toLowerCase().includes(lower));

  if (!match) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`**${query}** is not a Prime part or has no ducat value.`)
        .setColor(0x808080)],
    });
  }

  const name = match.i18n.en.name;

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Ducat Value' })
    .setTitle(name)
    .setDescription(`**${match.ducats}** ducats`)
    .setColor(0xDAA520);

  const thumb = match.i18n?.en?.thumb;
  if (thumb) embed.setThumbnail(assetUrl(thumb));

  await interaction.editReply({ embeds: [embed] });
}
