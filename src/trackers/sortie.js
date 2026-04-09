import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getBoss, getMissionType, getModifier, getNodeName } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';

export const key = 'sortie';

export function extract(ws) {
  const s = ws.Sorties?.[0];
  if (!s) return null;
  return {
    boss: s.Boss,
    activation: parseDate(s.Activation),
    expiry: parseDate(s.Expiry),
    variants: (s.Variants || []).map(v => ({
      missionType: v.missionType,
      modifier: v.modifierType,
      node: v.node,
    })),
  };
}

export function build(sortie) {
  if (!sortie) {
    return emptyEmbed('Sortie', 'No active sortie.');
  }

  const boss = getBoss(sortie.boss);
  const lines = sortie.variants.map((v, i) => {
    const mission = getMissionType(v.missionType);
    const mod = getModifier(v.modifier);
    const node = getNodeName(v.node);
    return `**${i + 1}.** ${mission} \u2022 ${mod}\n\u2003${node}`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: 'Sortie' })
    .setDescription(
      `**Boss:** ${boss}\n` +
      `Resets <t:${toUnix(sortie.expiry)}:R>\n\n` +
      lines.join('\n')
    )
    .setColor(COLORS.SORTIE);
}
