import { EmbedBuilder } from 'discord.js';
import { searchItems } from '../services/warframestat.js';
import { getItemImageUrl } from '../utils/warframe-data.js';
import { COLORS } from '../utils/embed-helpers.js';
import { e } from '../utils/emojis.js';

const RARITY_EMOJI = {
  Common: () => e('common'),
  Uncommon: () => e('uncommon'),
  Rare: () => e('rare'),
};

const TIER_COLORS = {
  lith: COLORS.LITH,
  meso: COLORS.MESO,
  neo: COLORS.NEO,
  axi: COLORS.AXI,
  requiem: COLORS.REQUIEM,
};

export async function relic(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const query = interaction.options.getString('name');

  // Strip "Relic" suffix — the API doesn't include it in item names
  const cleanQuery = query.replace(/\s*relic$/i, '').trim();

  let results;
  try {
    results = await searchItems(cleanQuery);
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

  // Prefer the Intact version (base relic without refinement)
  const lower = cleanQuery.toLowerCase();
  const intact = relics.find(r => {
    const n = r.name?.toLowerCase() || '';
    return n.includes(lower) &&
      !n.includes('exceptional') && !n.includes('flawless') && !n.includes('radiant');
  });
  const relic = intact || relics[0];

  const rewards = relic.rewards || [];
  const vaulted = relic.vaulted;
  const tier = relic.name?.split(' ')[0]?.toLowerCase();
  const color = TIER_COLORS[tier] || 0x4A90D9;

  // Clean relic name — remove "Intact" suffix if present
  let relicName = relic.name || query;
  relicName = relicName.replace(/\s*Intact$/i, '').replace(/\s*Relic$/i, '') + ' Relic';

  const common = rewards.filter(r => r.rarity === 'Common');
  const uncommon = rewards.filter(r => r.rarity === 'Uncommon');
  const rare = rewards.filter(r => r.rarity === 'Rare');

  const formatReward = (r) => {
    const emojiGetter = RARITY_EMOJI[r.rarity];
    const emoji = emojiGetter ? emojiGetter() : '';
    const name = r.item?.name || r.itemName || 'Unknown';
    const chance = r.chance != null ? ` \u2022 ${Number(r.chance).toFixed(1)}%` : '';
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
    .setTitle(`${relicName}${vaulted ? ' (Vaulted)' : ''}`)
    .setDescription(desc)
    .setColor(color);

  const img = getItemImageUrl(relic.uniqueName);
  if (img) embed.setThumbnail(img);

  await interaction.editReply({ embeds: [embed] });
}
