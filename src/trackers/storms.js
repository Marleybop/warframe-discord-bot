import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getNodeDetails, getTier } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';

export const key = 'storms';

export function extract(ws) {
  return (ws.VoidStorms || []).map(s => ({
    node: s.Node,
    activation: parseDate(s.Activation),
    expiry: parseDate(s.Expiry),
    tier: s.ActiveMissionTier,
  }));
}

export function build(storms) {
  if (!storms || storms.length === 0) {
    return emptyEmbed('Void Storms', 'No active void storms.');
  }

  const now = Date.now();
  const active = storms
    .filter(s => s.expiry > now)
    .sort((a, b) => {
      const order = { VoidT1: 1, VoidT2: 2, VoidT3: 3, VoidT4: 4, VoidT5: 5, VoidT6: 6 };
      return (order[a.tier] || 99) - (order[b.tier] || 99);
    });

  const lines = active.map(s => {
    const details = getNodeDetails(s.node);
    const node = details.value || s.node;
    const missionType = details.type || '';
    const tier = getTier(s.tier || '');
    return `${tier.emoji} **${tier.name}** \u2022 ${node} \u2022 ${missionType} \u2022 ends <t:${toUnix(s.expiry)}:R>`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: `Void Storms \u2500 ${active.length} Active` })
    .setDescription(lines.join('\n') || 'No active storms.')
    .setColor(COLORS.STORMS);
}
