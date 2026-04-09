import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getNodeName, getItemName, getItemImageUrl } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, progressBar, COLORS } from '../utils/embed-helpers.js';

export const key = 'events';

function getEventColor(tag) {
  if (!tag) return COLORS.EVENT_DEFAULT;
  const t = tag.toLowerCase();
  if (t.includes('anniversary') || t.includes('dex')) return COLORS.EVENT_ANNIVERSARY;
  if (t.includes('operation') || t.includes('event')) return COLORS.EVENT_OPERATION;
  return COLORS.EVENT_DEFAULT;
}

export function extract(ws) {
  return (ws.Goals || []).map(g => ({
    tag: g.Tag,
    desc: g.Desc,
    tooltip: g.ToolTip,
    node: g.Node,
    activation: parseDate(g.Activation),
    expiry: parseDate(g.Expiry),
    reward: g.Reward?.items || [],
    icon: g.Icon,
    personal: g.Personal || false,
    community: g.Community || false,
    healthPct: g.HealthPct,
    scoreTag: g.ScoreLocTag,
    faction: g.Faction,
    missionKey: g.MissionKeyName,
  }));
}

export function build(events) {
  if (!events || events.length === 0) {
    return [emptyEmbed('Events', 'No active events.')];
  }

  const now = Date.now();
  const active = events.filter(e => e.expiry > now);

  if (active.length === 0) {
    return [emptyEmbed('Events', 'No active events.')];
  }

  return active.map(e => {
    const name = getItemName(e.desc) || e.tag || 'Unknown Event';
    const node = e.node ? getNodeName(e.node) : '';
    const rewards = e.reward.map(r => getItemName(r)).join(', ');

    let desc = '';
    if (node) desc += `**Location** \u2022 ${node}\n`;
    if (rewards) desc += `**Reward** \u2022 ${rewards}\n`;
    if (e.healthPct !== undefined) {
      const pct = Math.round(e.healthPct * 100);
      desc += `**Progress** \u2022 ${progressBar(e.healthPct)} ${pct}%\n`;
    }
    if (e.community) desc += '**Type** \u2022 Community event\n';
    desc += `**Ends** \u2022 <t:${toUnix(e.expiry)}:R> \u2022 <t:${toUnix(e.expiry)}:f>`;

    const embed = new EmbedBuilder()
      .setAuthor({ name: name })
      .setDescription(desc)
      .setColor(getEventColor(e.tag));

    const rewardImg = e.reward.length > 0 ? getItemImageUrl(e.reward[0]) : null;
    const img = rewardImg || getItemImageUrl(e.desc);
    if (img) embed.setThumbnail(img);

    return embed;
  });
}
