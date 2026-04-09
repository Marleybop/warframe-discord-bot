import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';

export const key = 'boosters';

const BOOSTER_NAMES = {
  GAMEPLAY_MONEY_REWARD_AMOUNT: 'Credits',
  GAMEPLAY_PICKUP_AMOUNT: 'Resources',
  GAMEPLAY_AFFINITY_AMOUNT: 'Affinity',
  GAMEPLAY_MOD_REWARD_AMOUNT: 'Mod Drop Rate',
};

export function extract(ws) {
  return (ws.GlobalUpgrades || []).map(g => ({
    type: g.UpgradeType,
    operation: g.OperationType,
    value: g.Value,
    tag: g.LocalizeTag,
    descTag: g.LocalizeDescTag,
    activation: parseDate(g.Activation),
    expiry: parseDate(g.ExpiryDate),
  }));
}

export function build(boosters) {
  if (!boosters || boosters.length === 0) {
    return emptyEmbed('Global Boosters', 'No active boosters.');
  }

  const now = Date.now();
  const active = boosters.filter(b => b.expiry > now);

  if (active.length === 0) {
    return emptyEmbed('Global Boosters', 'No active boosters.');
  }

  const lines = active.map(b => {
    const name = BOOSTER_NAMES[b.type] || b.type;
    const mult = b.operation === 'MULTIPLY' ? `${b.value}x` : `+${b.value}`;
    return `**${mult} ${name}**\nExpires <t:${toUnix(b.expiry)}:R>`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: `Global Boosters \u2500 ${active.length} Active` })
    .setDescription(lines.join('\n\n'))
    .setColor(COLORS.BOOSTERS);
}
