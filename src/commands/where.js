import { EmbedBuilder } from 'discord.js';
import { searchDrops } from '../services/warframestat.js';

const MAX_RESULTS = 15;

export async function where(interaction) {
  await interaction.deferReply();

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

  // Pick the best matching group
  const lower = query.toLowerCase();
  const bestKey = Object.keys(grouped).find(k => k.toLowerCase().includes(lower))
    || Object.keys(grouped)[0];
  const results = grouped[bestKey].slice(0, MAX_RESULTS);

  const lines = results.map(d => {
    const chance = d.chance ? `${(d.chance * 100).toFixed(1)}%` : '?%';
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
