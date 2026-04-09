import { EmbedBuilder } from 'discord.js';
import { getWarframe } from '../services/warframestat.js';
import { searchItems } from '../services/warframestat.js';

export async function warframe(interaction) {
  await interaction.deferReply();

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

  // Stats
  const stats = [
    `Health: **${wf.health || '?'}** \u2022 Shield: **${wf.shield || '?'}**`,
    `Armor: **${wf.armor || '?'}** \u2022 Energy: **${wf.power || '?'}**`,
    `Sprint: **${wf.sprintSpeed || '?'}** \u2022 Mastery: **${wf.masteryReq || 0}**`,
  ].join('\n');

  // Abilities
  const abilities = (wf.abilities || []).map(a =>
    `**${a.name}** \u2500 ${a.description?.split('.')[0]?.replace(/<[^>]+>/g, '') || 'No description'}.`
  ).join('\n');

  // Passive
  const passive = wf.passiveDescription
    ? wf.passiveDescription.replace(/<[^>]+>/g, '').replace(/\|[A-Z_]+\|/g, '?')
    : null;

  // Exalted weapon
  const exalted = wf.exalted?.length > 0
    ? wf.exalted.map(e => e.split('/').pop().replace(/([A-Z])/g, ' $1').trim()).join(', ')
    : null;

  // Farm location from components
  const drops = [];
  for (const comp of wf.components || []) {
    for (const drop of comp.drops || []) {
      if (!drops.some(d => d.location === drop.location)) {
        drops.push(drop);
      }
    }
  }
  const farmLines = drops.slice(0, 5).map(d => {
    const chance = d.chance ? `${(d.chance * 100).toFixed(1)}%` : '';
    return `${d.location}${chance ? ` \u2022 ${chance}` : ''}`;
  });

  // Search for augment mods
  let augments = [];
  try {
    const baseName = wf.name.replace(' Prime', '');
    const modResults = await searchItems(baseName + ' augment');
    augments = (modResults || [])
      .filter(m => m.isAugment && m.compatName?.toLowerCase().includes(baseName.toLowerCase()))
      .map(m => m.name)
      .slice(0, 8);
  } catch { /* augment lookup is optional */ }

  let desc = `__Stats__\n${stats}`;
  if (passive) desc += `\n\n__Passive__\n${passive}`;
  if (exalted) desc += `\n\n__Exalted__\n${exalted}`;
  desc += `\n\n__Abilities__\n${abilities}`;
  if (augments.length > 0) desc += `\n\n__Augments__\n${augments.join(', ')}`;
  if (farmLines.length > 0) desc += `\n\n__How to Farm__\n${farmLines.join('\n')}`;

  const embed = new EmbedBuilder()
    .setTitle(wf.name)
    .setDescription(desc)
    .setColor(wf.isPrime ? 0xD4AF37 : 0x4A90D9);

  if (wf.wikiaUrl) embed.setURL(wf.wikiaUrl);
  if (wf.imageName) embed.setThumbnail(`https://cdn.warframestat.us/img/${wf.imageName}`);

  await interaction.editReply({ embeds: [embed] });
}
