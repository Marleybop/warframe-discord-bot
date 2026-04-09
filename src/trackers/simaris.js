import { EmbedBuilder } from 'discord.js';
import { emptyEmbed } from '../utils/embed-helpers.js';

export const key = 'simaris';

export function extract(ws) {
  const lib = ws.LibraryInfo;
  if (!lib) return null;
  return {
    target: lib.LastCompletedTargetType || null,
  };
}

export function build(data) {
  if (!data || !data.target) {
    return emptyEmbed('Cephalon Simaris', 'No synthesis target data.');
  }

  // Clean up the target path to a readable name
  const raw = data.target.split('/').pop();
  const name = raw
    .replace('Target', '')
    .replace(/(\d+)$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  return new EmbedBuilder()
    .setAuthor({ name: 'Cephalon Simaris' })
    .setDescription(`**Synthesis Target:** ${name}`)
    .setColor(0x00CED1);
}
