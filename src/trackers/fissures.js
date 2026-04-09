import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getTier, getMissionType, getRegion } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, TIER_COLORS } from '../utils/embed-helpers.js';

export const key = 'fissures';

const RELIC_IMAGES = {
  VoidT1: 'https://cdn.warframestat.us/img/lith-intact.png',
  VoidT2: 'https://cdn.warframestat.us/img/meso-intact.png',
  VoidT3: 'https://cdn.warframestat.us/img/neo-intact.png',
  VoidT4: 'https://cdn.warframestat.us/img/axi-intact.png',
  VoidT5: 'https://cdn.warframestat.us/img/requiem-intact.png',
  VoidT6: 'https://cdn.warframestat.us/img/axi-radiant.png',
};

export function extract(ws) {
  return (ws.ActiveMissions || []).map(m => ({
    node: m.Node,
    missionType: m.MissionType,
    tier: m.Modifier,
    region: m.Region,
    activation: parseDate(m.Activation),
    expiry: parseDate(m.Expiry),
  }));
}

export function build(fissures) {
  const now = Date.now();
  const active = fissures
    .filter(f => f.expiry > now)
    .sort((a, b) => {
      const order = { VoidT1: 1, VoidT2: 2, VoidT3: 3, VoidT4: 4, VoidT5: 5, VoidT6: 6 };
      return (order[a.tier] || 99) - (order[b.tier] || 99);
    });

  if (active.length === 0) {
    return [emptyEmbed('Void Fissures', 'No active fissures.')];
  }

  const grouped = {};
  for (const f of active) {
    const tier = getTier(f.tier);
    if (!grouped[f.tier]) grouped[f.tier] = { tier, fissures: [] };
    grouped[f.tier].fissures.push(f);
  }

  const embeds = [];
  for (const k of ['VoidT1', 'VoidT2', 'VoidT3', 'VoidT4', 'VoidT5', 'VoidT6']) {
    const group = grouped[k];
    if (!group) continue;

    const lines = group.fissures.map(f => {
      const mission = getMissionType(f.missionType);
      const region = f.region !== null ? getRegion(f.region) : '';
      return `**${mission}** \u2022 ${region} \u2022 ends <t:${toUnix(f.expiry)}:R>`;
    });

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${group.tier.emoji} ${group.tier.name}` })
      .setDescription(lines.join('\n'))
      .setColor(TIER_COLORS[k] || 0x4A90D9);

    const relicImg = RELIC_IMAGES[k];
    if (relicImg) embed.setThumbnail(relicImg);

    embeds.push(embed);
  }
  return embeds;
}
