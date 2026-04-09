import { EmbedBuilder } from 'discord.js';
import { searchDrops } from '../services/warframestat.js';

const MAX_RESULTS = 15;

export async function where(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const query = interaction.options.getString('item');

  let drops;
  try {
    drops = await searchDrops(query);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Couldn't search for **${query}**. Try again.`)
        .setColor(0xFF0000)],
    });
  }

  if (!drops || drops.length === 0) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No drop sources found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  // Group by item name (search can return multiple items)
  const grouped = {};
  for (const drop of drops) {
    const item = drop.item || 'Unknown';
    if (!grouped[item]) grouped[item] = [];
    grouped[item].push(drop);
  }

  // If query looks like a set (e.g. "Nikana Prime Set"), show all components
  const lower = query.toLowerCase();
  const isSetQuery = lower.includes(' set') || lower.includes(' prime');
  const matchingKeys = Object.keys(grouped).filter(k => k.toLowerCase().includes(
    lower.replace(' set', '').replace(' prime', ' prime').trim()
  ));

  if (isSetQuery && matchingKeys.length > 1) {
    // Multi-component display — show each part's best drop source
    const embeds = [];
    for (const key of matchingKeys.slice(0, 10)) {
      const sources = grouped[key];
      const lines = sources.slice(0, 5).map(d => {
        const chance = d.chance != null ? `${Number(d.chance).toFixed(1)}%` : '?%';
        return `${d.place} \u2022 ${chance} \u2022 ${d.rarity || ''}`;
      });

      embeds.push(new EmbedBuilder()
        .setAuthor({ name: key })
        .setDescription(lines.join('\n'))
        .setColor(0x2ECC71)
      );
    }
    return interaction.editReply({ embeds: embeds.slice(0, 10) });
  }

  // Single item — pick best matching group
  const bestKey = matchingKeys[0]
    || Object.keys(grouped).find(k => k.toLowerCase().includes(lower))
    || Object.keys(grouped)[0];
  const results = grouped[bestKey].slice(0, MAX_RESULTS);

  const lines = results.map(d => {
    const chance = d.chance != null ? `${Number(d.chance).toFixed(1)}%` : '?%';
    const rarity = d.rarity || '';
    return `**${d.place}**\n\u2003${chance} \u2022 ${rarity}`;
  });

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Drop Sources' })
    .setTitle(bestKey)
    .setDescription(lines.join('\n'))
    .setColor(0x2ECC71);

  if (results.length < grouped[bestKey].length) {
    embed.setFooter({ text: `Showing ${results.length} of ${grouped[bestKey].length} sources` });
  }

  await interaction.editReply({ embeds: [embed] });
}
