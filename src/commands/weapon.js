import { EmbedBuilder } from 'discord.js';
import { getWeapon } from '../services/warframestat.js';

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

  const attacks = wp.attacks || [];
  const hasIncarnon = attacks.some(a => a.name?.toLowerCase().includes('incarnon'));

  // ── Header ──
  const tags = [];
  if (wp.category) tags.push(wp.category);
  if (wp.masteryReq) tags.push(`MR ${wp.masteryReq}`);
  if (wp.noise) tags.push(wp.noise);
  if (wp.trigger) tags.push(wp.trigger);

  let desc = tags.join(' \u2022 ') + '\n';

  // ── Stats ──
  const stats = [];
  if (wp.totalDamage) stats.push(`Damage: **${wp.totalDamage}**`);
  if (wp.criticalChance) stats.push(`Crit: **${(wp.criticalChance * 100).toFixed(1)}%**`);
  if (wp.criticalMultiplier) stats.push(`Crit Multi: **${wp.criticalMultiplier}x**`);
  if (wp.statusChance) stats.push(`Status: **${(wp.statusChance * 100).toFixed(1)}%**`);
  if (wp.fireRate) stats.push(`Fire Rate: **${wp.fireRate}**`);
  if (wp.magazineSize) stats.push(`Magazine: **${wp.magazineSize}**`);
  if (wp.reloadTime) stats.push(`Reload: **${wp.reloadTime}s**`);
  if (wp.multishot) stats.push(`Multishot: **${wp.multishot}**`);

  desc += '\n__Stats__\n' + stats.join('\n');

  // ── Damage Breakdown ──
  const DAMAGE_TYPES = [
    'Impact', 'Puncture', 'Slash', 'Heat', 'Cold', 'Electricity',
    'Toxin', 'Blast', 'Radiation', 'Gas', 'Magnetic', 'Viral',
    'Corrosive', 'Void',
  ];
  const dmg = [];
  if (wp.damagePerShot?.length > 0) {
    wp.damagePerShot.forEach((val, i) => {
      if (val > 0 && DAMAGE_TYPES[i]) dmg.push(`${DAMAGE_TYPES[i]}: ${Math.round(val)}`);
    });
  }
  if (dmg.length > 0) desc += '\n\n__Damage__\n' + dmg.join(' \u2022 ');

  // ── Riven & Incarnon ──
  const extras = [];
  if (wp.disposition) extras.push(`Riven Disposition: **${wp.disposition}/5**`);
  if (hasIncarnon) extras.push('\u2728 **Incarnon Genesis Available**');

  if (extras.length > 0) desc += '\n\n' + extras.join('\n');

  // ── Incarnon Form Stats ──
  if (hasIncarnon) {
    const incarnon = attacks.find(a => a.name?.toLowerCase() === 'incarnon form');
    if (incarnon) {
      const iStats = [];
      if (incarnon.damage) {
        const iDmg = Object.entries(incarnon.damage)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `${k}: ${Math.round(v)}`)
          .join(' \u2022 ');
        if (iDmg) iStats.push(iDmg);
      }
      if (incarnon.crit_chance) iStats.push(`Crit: ${(incarnon.crit_chance * 100).toFixed(1)}%`);
      if (incarnon.crit_mult) iStats.push(`Multi: ${incarnon.crit_mult}x`);
      if (incarnon.status_chance) iStats.push(`Status: ${(incarnon.status_chance * 100).toFixed(1)}%`);
      if (iStats.length > 0) desc += '\n\n__Incarnon Form__\n' + iStats.join('\n');
    }
  }

  // ── Components & How to Get ──
  const components = wp.components || [];
  if (components.length > 0) {
    const compLines = components.map(c => {
      let line = `**${c.name}** x${c.itemCount}`;
      if (c.ducats) line += ` (${c.ducats} ducats)`;

      // Drop sources for this component
      const drops = (c.drops || []).slice(0, 3);
      if (drops.length > 0) {
        const dropStr = drops.map(d => {
          const chance = d.chance ? `${(d.chance * 100).toFixed(1)}%` : '';
          return `${d.location}${chance ? ` ${chance}` : ''}`;
        }).join(', ');
        line += `\n\u2003\u21B3 ${dropStr}`;
      }
      return line;
    });

    desc += '\n\n__Components__\n' + compLines.join('\n');
  }

  // ── Crafting Cost ──
  if (wp.buildPrice) {
    const buildTime = wp.buildTime ? `${Math.round(wp.buildTime / 3600)}h` : '?';
    desc += `\n\n__Crafting__\n${wp.buildPrice.toLocaleString()} Credits \u2022 ${buildTime} build time`;
  }

  const embed = new EmbedBuilder()
    .setTitle(wp.name)
    .setDescription(desc)
    .setColor(wp.isPrime ? 0xD4AF37 : 0xE67E22);

  if (wp.wikiaUrl) embed.setURL(wp.wikiaUrl);
  if (wp.imageName) embed.setThumbnail(`https://cdn.warframestat.us/img/${wp.imageName}`);

  await interaction.editReply({ embeds: [embed] });
}
