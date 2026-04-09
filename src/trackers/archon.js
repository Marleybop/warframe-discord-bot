import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getBoss, getMissionType, getNodeDetails } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';

export const key = 'archon';

export function extract(ws) {
  const s = ws.LiteSorties?.[0];
  if (!s) return null;
  return {
    boss: s.Boss,
    activation: parseDate(s.Activation),
    expiry: parseDate(s.Expiry),
    missions: (s.Missions || []).map(m => ({
      missionType: m.missionType,
      node: m.node,
    })),
  };
}

export function build(archon) {
  if (!archon) {
    return emptyEmbed('Archon Hunt', 'No active Archon Hunt.');
  }

  const boss = getBoss(archon.boss);
  const lines = archon.missions.map((m, i) => {
    const mission = getMissionType(m.missionType);
    const details = getNodeDetails(m.node);
    const node = details.value || m.node;
    const enemy = details.enemy || '';
    return `**${i + 1}.** ${mission}\n\u2003${node}${enemy ? ` \u2022 ${enemy}` : ''}`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: 'Archon Hunt' })
    .setDescription(
      `**Archon:** ${boss}\n` +
      `Resets <t:${toUnix(archon.expiry)}:R>\n\n` +
      lines.join('\n')
    )
    .setColor(COLORS.ARCHON);
}
