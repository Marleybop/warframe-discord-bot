import { EmbedBuilder } from 'discord.js';
import { getWeapon } from '../services/warframestat.js';

const DAMAGE_TYPES = [
  'Impact', 'Puncture', 'Slash', 'Heat', 'Cold', 'Electricity',
  'Toxin', 'Blast', 'Radiation', 'Gas', 'Magnetic', 'Viral',
  'Corrosive', 'Void',
];

export async function weapon(interaction) {
  await interaction.deferReply();

  const query = interaction.options.getString('name');

  let wp;
  try {
    wp = await getWeapon(query);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Couldn't find weapon **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  if (!wp || !wp.name) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No weapon found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  // Combat stats
  const lines = [];
  if (wp.totalDamage) lines.push(`Total Damage: **${wp.totalDamage}**`);
  if (wp.criticalChance) lines.push(`Crit Chance: **${(wp.criticalChance * 100).toFixed(1)}%**`);
  if (wp.criticalMultiplier) lines.push(`Crit Multi: **${wp.criticalMultiplier}x**`);
  if (wp.statusChance) lines.push(`Status: **${(wp.statusChance * 100).toFixed(1)}%**`);
  if (wp.fireRate) lines.push(`Fire Rate: **${wp.fireRate}**`);
  if (wp.magazineSize) lines.push(`Magazine: **${wp.magazineSize}**`);
  if (wp.reloadTime) lines.push(`Reload: **${wp.reloadTime}s**`);
  if (wp.multishot) lines.push(`Multishot: **${wp.multishot}**`);
  if (wp.disposition) lines.push(`Riven Dispo: **${wp.disposition}/5**`);

  // Damage breakdown from damagePerShot
  const dmgBreakdown = [];
  if (wp.damagePerShot?.length > 0) {
    wp.damagePerShot.forEach((val, i) => {
      if (val > 0 && DAMAGE_TYPES[i]) {
        dmgBreakdown.push(`${DAMAGE_TYPES[i]}: ${Math.round(val)}`);
      }
    });
  }

  let desc = '';
  if (wp.category) desc += `**${wp.category}**`;
  if (wp.masteryReq) desc += ` \u2022 MR ${wp.masteryReq}`;
  if (wp.noise) desc += ` \u2022 ${wp.noise}`;
  if (wp.trigger) desc += ` \u2022 ${wp.trigger}`;
  desc += '\n\n';

  desc += '__Stats__\n' + lines.join('\n');

  if (dmgBreakdown.length > 0) {
    desc += '\n\n__Damage__\n' + dmgBreakdown.join(' \u2022 ');
  }

  // Farm info
  const drops = [];
  for (const comp of wp.components || []) {
    for (const drop of comp.drops || []) {
      if (!drops.some(d => d.location === drop.location)) {
        drops.push(drop);
      }
    }
  }
  if (drops.length > 0) {
    const farmLines = drops.slice(0, 5).map(d => {
      const chance = d.chance ? `${(d.chance * 100).toFixed(1)}%` : '';
      return `${d.location}${chance ? ` \u2022 ${chance}` : ''}`;
    });
    desc += '\n\n__How to Farm__\n' + farmLines.join('\n');
  }

  const embed = new EmbedBuilder()
    .setTitle(wp.name)
    .setDescription(desc)
    .setColor(wp.isPrime ? 0xD4AF37 : 0xE67E22);

  if (wp.wikiaUrl) embed.setURL(wp.wikiaUrl);
  if (wp.imageName) embed.setThumbnail(`https://cdn.warframestat.us/img/${wp.imageName}`);

  await interaction.editReply({ embeds: [embed] });
}
