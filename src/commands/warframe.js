import { EmbedBuilder } from 'discord.js';
import { getWarframe, searchItems } from '../services/warframestat.js';
import { e } from '../utils/emojis.js';

export async function warframe(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const query = interaction.options.getString('name');

  let wf;
  try {
    wf = await getWarframe(query);
  } catch {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`Couldn't find warframe **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  if (!wf || !wf.name) {
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setDescription(`No warframe found for **${query}**`)
        .setColor(0xFF0000)],
    });
  }

  // ── Stats ──
  const stats = [
    `Health: **${wf.health || '?'}** \u2022 Shield: **${wf.shield || '?'}**`,
    `Armor: **${wf.armor || '?'}** \u2022 Energy: **${wf.power || '?'}**`,
    `Sprint: **${wf.sprintSpeed || '?'}** \u2022 Mastery: **${wf.masteryReq || 0}**`,
  ].join('\n');

  let desc = `__Stats__\n${stats}`;

  // ── Passive ──
  const passive = wf.passiveDescription
    ? wf.passiveDescription.replace(/<[^>]+>/g, '').replace(/\|[A-Z_]+\|/g, '?')
    : null;
  if (passive) desc += `\n\n__Passive__\n${passive}`;

  // ── Abilities ──
  const abilities = (wf.abilities || []).map(a =>
    `**${a.name}** \u2500 ${a.description?.split('.')[0]?.replace(/<[^>]+>/g, '') || 'No description'}.`
  ).join('\n');
  desc += `\n\n__Abilities__\n${abilities}`;

  // ── Exalted Weapon ──
  const exalted = wf.exalted?.length > 0
    ? wf.exalted.map(e => e.split('/').pop().replace(/([A-Z])/g, ' $1').trim()).join(', ')
    : null;
  if (exalted) desc += `\n\n__Exalted__\n${exalted}`;

  // ── Augments ──
  let augments = [];
  try {
    const baseName = wf.name.replace(' Prime', '');
    const modResults = await searchItems(baseName + ' augment');
    augments = (modResults || [])
      .filter(m => m.isAugment && m.compatName?.toLowerCase().includes(baseName.toLowerCase()))
      .map(m => m.name)
      .slice(0, 8);
  } catch { /* optional */ }
  if (augments.length > 0) desc += `\n\n__Augments__\n${augments.join(', ')}`;

  // ── Components & How to Get ──
  const components = (wf.components || []).filter(c => c.name && c.itemCount);
  if (components.length > 0) {
    const compLines = components.map(c => {
      let line = `**${c.name}** x${c.itemCount}`;
      if (c.ducats) line += ` (${c.ducats} ${e('ducats')}ducats)`;

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
    desc += `\n\n__Components__\n${compLines.join('\n')}`;
  }

  // ── Crafting Cost ──
  if (wf.buildPrice) {
    const buildTime = wf.buildTime ? `${Math.round(wf.buildTime / 3600)}h` : '?';
    desc += `\n\n__Crafting__\n${wf.buildPrice.toLocaleString()} ${e('credits')}Credits \u2022 ${buildTime} build time`;
  }

  const embed = new EmbedBuilder()
    .setTitle(wf.name)
    .setDescription(desc)
    .setColor(wf.isPrime ? 0xD4AF37 : 0x4A90D9);

  if (wf.wikiaUrl) embed.setURL(wf.wikiaUrl);
  if (wf.imageName) embed.setThumbnail(`https://cdn.warframestat.us/img/${wf.imageName}`);

  await interaction.editReply({ embeds: [embed] });
}
