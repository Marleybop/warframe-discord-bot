import { EmbedBuilder } from 'discord.js';
import { getMod } from '../services/warframestat.js';

const RARITY_COLORS = {
  Common: 0x8B6914,
  Uncommon: 0xC0C0C0,
  Rare: 0xD4AF37,
  Legendary: 0xFFFFFF,
};

const POLARITY_EMOJI = {
  madurai: '\u2694\uFE0F',
  vazarin: '\u{1F6E1}\uFE0F',
  naramon: '\u2014',
  zenurik: '\u2B50',
  unairu: '\u{1F7E0}',
  penjaga: '\u2666\uFE0F',
};

export async function mod(interaction) {
  await interaction.deferReply();

  const query = interaction.options.getString('name');

  let m;
  try {
    m = await getMod(query);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Couldn't find mod **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  if (!m || !m.name) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No mod found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  const polarity = POLARITY_EMOJI[m.polarity] || m.polarity || '';
  const rarity = m.rarity || '';
  const drain = m.baseDrain != null ? `${m.baseDrain}` : '?';
  const maxRank = m.fusionLimit != null ? `${m.fusionLimit}` : '?';

  let desc = '';
  desc += `**${rarity}** ${polarity} \u2022 Drain: ${drain} \u2022 Max Rank: ${maxRank}`;
  if (m.compatName) desc += ` \u2022 ${m.compatName}`;
  if (m.isAugment) desc += ' \u2022 Augment';

  // Stats at each rank
  if (m.levelStats?.length > 0) {
    desc += '\n\n__Stats by Rank__';
    // Show first, middle, and max rank to keep it compact
    const ranks = [];
    ranks.push(0);
    if (m.levelStats.length > 2) ranks.push(Math.floor(m.levelStats.length / 2));
    ranks.push(m.levelStats.length - 1);

    // Deduplicate
    const unique = [...new Set(ranks)];
    for (const i of unique) {
      const stats = m.levelStats[i]?.stats || m.levelStats[i];
      const statStr = Array.isArray(stats) ? stats.join(', ') : String(stats);
      desc += `\n**R${i}:** ${statStr}`;
    }
  }

  // Drop locations
  if (m.drops?.length > 0) {
    const dropLines = m.drops.slice(0, 5).map(d => {
      const chance = d.chance ? `${(d.chance * 100).toFixed(2)}%` : '';
      return `${d.location}${chance ? ` \u2022 ${chance}` : ''}`;
    });
    desc += '\n\n__Drop Sources__\n' + dropLines.join('\n');
  }

  const color = RARITY_COLORS[m.rarity] || 0x4A90D9;

  const embed = new EmbedBuilder()
    .setTitle(m.name)
    .setDescription(desc)
    .setColor(color);

  if (m.wikiaUrl) embed.setURL(m.wikiaUrl);
  if (m.wikiaThumbnail) embed.setImage(m.wikiaThumbnail);
  else if (m.imageName) embed.setThumbnail(`https://cdn.warframestat.us/img/${m.imageName}`);

  await interaction.editReply({ embeds: [embed] });
}
