import { EmbedBuilder } from 'discord.js';
import { searchItems } from '../services/warframestat.js';
import { getItemImageUrl } from '../utils/warframe-data.js';
import { COLORS } from '../utils/embed-helpers.js';

const RARITY_EMOJI = {
  Common: '\u{1F7E4}',    // brown
  Uncommon: '\u{1F7E0}',  // silver/white → using orange
  Rare: '\u{1F7E1}',      // gold
};

const TIER_COLORS = {
  lith: COLORS.LITH,
  meso: COLORS.MESO,
  neo: COLORS.NEO,
  axi: COLORS.AXI,
  requiem: COLORS.REQUIEM,
};

export async function relic(interaction) {
  await interaction.deferReply();

  const query = interaction.options.getString('name');

  let results;
  try {
    results = await searchItems(query);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Couldn't search for **${query}**. Try again.`)
        .setColor(0xFF0000)],
    });
  }

  // Filter to relics only
  const relics = (results || []).filter(r =>
    r.category === 'Relics' || r.type === 'Relic'
    || /^(Lith|Meso|Neo|Axi|Requiem)\s/i.test(r.name)
  );

  if (relics.length === 0) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No relic found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  // Pick the best match
  const lower = query.toLowerCase();
  const relic = relics.find(r => r.name?.toLowerCase().includes(lower)) || relics[0];

  const rewards = relic.rewards || [];
  const vaulted = relic.vaulted;
  const tier = relic.name?.split(' ')[0]?.toLowerCase();
  const color = TIER_COLORS[tier] || 0x4A90D9;

  // Group rewards by rarity
  const common = rewards.filter(r => r.rarity === 'Common');
  const uncommon = rewards.filter(r => r.rarity === 'Uncommon');
  const rare = rewards.filter(r => r.rarity === 'Rare');

  const formatReward = (r) => {
    const emoji = RARITY_EMOJI[r.rarity] || '';
    const name = r.item?.name || r.itemName || 'Unknown';
    const chance = r.chance ? ` \u2022 ${r.chance.toFixed(0)}%` : '';
    return `${emoji} ${name}${chance}`;
  };

  let desc = '';
  if (common.length > 0) {
    desc += '**Common**\n' + common.map(formatReward).join('\n') + '\n\n';
  }
  if (uncommon.length > 0) {
    desc += '**Uncommon**\n' + uncommon.map(formatReward).join('\n') + '\n\n';
  }
  if (rare.length > 0) {
    desc += '**Rare**\n' + rare.map(formatReward).join('\n');
  }

  if (!desc) desc = 'No reward data available.';

  const embed = new EmbedBuilder()
    .setTitle(`${relic.name}${vaulted ? ' (Vaulted)' : ''}`)
    .setDescription(desc)
    .setColor(color);

  // Try to get the relic image
  const img = getItemImageUrl(relic.uniqueName);
  if (img) embed.setThumbnail(img);

  await interaction.editReply({ embeds: [embed] });
}
