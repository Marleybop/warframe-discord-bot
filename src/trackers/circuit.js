import { EmbedBuilder } from 'discord.js';
import { emptyEmbed, COLORS } from '../utils/embed-helpers.js';

export const key = 'circuit';

export function extract(ws) {
  const choices = ws.EndlessXpChoices || [];
  return choices.map(c => ({
    category: c.Category,
    choices: c.Choices || [],
  }));
}

export function build(circuit) {
  if (!circuit || circuit.length === 0) {
    return emptyEmbed('The Circuit', 'No circuit data.');
  }

  const lines = circuit.map(c => {
    const label = c.category === 'EXC_NORMAL' ? 'Warframes' : 'Weapons';
    const names = c.choices.map(n => n
      .replace(/([A-Z])/g, ' $1').trim()
      .replace(' And ', ' & ')
    );
    return `**${label}:** ${names.join(', ')}`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: 'The Circuit' })
    .setDescription(lines.join('\n'))
    .setColor(COLORS.CIRCUIT);
}
