import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getChallengeName } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';

export const key = 'nightwave';

export function extract(ws) {
  const info = ws.SeasonInfo;
  if (!info) return null;
  return {
    tag: info.AffiliationTag,
    activation: parseDate(info.Activation),
    expiry: parseDate(info.Expiry),
    challenges: (info.ActiveChallenges || []).map(c => ({
      challenge: c.Challenge,
      activation: parseDate(c.Activation),
      expiry: parseDate(c.Expiry),
      isDaily: c.Daily || false,
    })),
  };
}

export function build(nightwave) {
  if (!nightwave || nightwave.challenges.length === 0) {
    return emptyEmbed('Nightwave', 'No active challenges.');
  }

  const now = Date.now();
  const active = nightwave.challenges.filter(c => c.expiry > now);

  const dailies = active.filter(c => c.isDaily);
  const weeklies = active.filter(c => !c.isDaily && !c.challenge.includes('WeeklyHard'));
  const elites = active.filter(c => c.challenge.includes('WeeklyHard'));

  const formatChallenge = (c) => {
    const info = getChallengeName(c.challenge);
    const title = info.title || 'Unknown';
    const desc = info.desc ? ` \u2500 ${info.desc}` : '';
    return `**${title}**${desc}\n\u2003ends <t:${toUnix(c.expiry)}:R>`;
  };

  const sections = [];
  if (dailies.length > 0) sections.push('__Daily__\n' + dailies.map(formatChallenge).join('\n'));
  if (weeklies.length > 0) sections.push('__Weekly__\n' + weeklies.map(formatChallenge).join('\n'));
  if (elites.length > 0) sections.push('__Elite Weekly__\n' + elites.map(formatChallenge).join('\n'));

  return new EmbedBuilder()
    .setAuthor({ name: `Nightwave \u2500 ${active.length} Challenges` })
    .setDescription(sections.join('\n\n') || 'No active challenges.')
    .setColor(COLORS.NIGHTWAVE);
}
