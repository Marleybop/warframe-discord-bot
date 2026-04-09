import { EmbedBuilder } from 'discord.js';
import { progressBar, emptyEmbed } from '../utils/embed-helpers.js';

export const key = 'fomorian';

export function extract(ws) {
  const pct = ws.ProjectPct || [];
  if (pct.length < 2) return null;

  return {
    fomorian: pct[0],
    razorback: pct[1],
  };
}

export function build(data) {
  if (!data) {
    return emptyEmbed('Fomorian / Razorback', 'No construction data.');
  }

  const fomorianPct = Math.round(data.fomorian * 100) / 100;
  const razorbackPct = Math.round(data.razorback * 100) / 100;

  const fomorianBar = progressBar(data.fomorian / 100, 15);
  const razorbackBar = progressBar(data.razorback / 100, 15);

  const fomorianAlert = data.fomorian >= 100 ? ' \u26A0\uFE0F **ACTIVE**' : '';
  const razorbackAlert = data.razorback >= 100 ? ' \u26A0\uFE0F **ACTIVE**' : '';

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Fomorian / Razorback Construction' })
    .setDescription(
      `**Balor Fomorian**${fomorianAlert}\n` +
      `${fomorianBar} ${fomorianPct}%\n\n` +
      `**Razorback Armada**${razorbackAlert}\n` +
      `${razorbackBar} ${razorbackPct}%`
    )
    .setColor(data.fomorian >= 100 || data.razorback >= 100 ? 0xFF0000 : 0x555555);

  return embed;
}
