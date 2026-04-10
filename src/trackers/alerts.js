import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getMissionType, getNodeName, getItemName } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';
import { e } from '../utils/emojis.js';

export const key = 'alerts';

export function extract(ws) {
  return (ws.Alerts || []).map(a => ({
    mission: a.MissionInfo,
    activation: parseDate(a.Activation),
    expiry: parseDate(a.Expiry),
  }));
}

export function build(alerts) {
  if (!alerts || alerts.length === 0) {
    return emptyEmbed('Alerts', 'No active alerts.');
  }

  const now = Date.now();
  const active = alerts.filter(a => a.expiry > now);

  if (active.length === 0) {
    return emptyEmbed('Alerts', 'No active alerts.');
  }

  const lines = active.map(a => {
    const mission = a.mission;
    const type = getMissionType(mission?.missionType || '');
    const node = getNodeName(mission?.location || '');
    const reward = mission?.missionReward;
    let rewardText = '';
    if (reward?.items?.length) rewardText = reward.items.map(i => getItemName(i)).join(', ');
    if (reward?.credits) rewardText += (rewardText ? ' + ' : '') + `${reward.credits} ${e('credits')}cr`;
    return `**${type}** \u2022 ${node}\n\u2003${rewardText || 'No reward listed'} \u2022 ends <t:${toUnix(a.expiry)}:R>`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: `Alerts \u2500 ${active.length} Active` })
    .setDescription(lines.join('\n\n'))
    .setColor(COLORS.ALERTS);
}
