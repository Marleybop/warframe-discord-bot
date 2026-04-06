import { EmbedBuilder } from 'discord.js';
import {
  getTier, getMissionType, getNodeName, getNodeDetails, getRegion,
  getBoss, getModifier, getFaction, getItemName, getChallengeName,
} from './warframe-data.js';

function toUnix(date) {
  return Math.floor(date / 1000);
}


const TIER_COLORS = {
  VoidT1: 0xA68B5B,
  VoidT2: 0x3A86FF,
  VoidT3: 0xC1121F,
  VoidT4: 0xFFB703,
  VoidT5: 0x7B2D8B,
  VoidT6: 0xBBBBBB,
};

// ─── FISSURES ────────────────────────────────────────

export function buildFissureEmbeds(fissures) {
  const now = Date.now();
  const active = fissures
    .filter(f => f.expiry > now)
    .sort((a, b) => {
      const order = { VoidT1: 1, VoidT2: 2, VoidT3: 3, VoidT4: 4, VoidT5: 5, VoidT6: 6 };
      return (order[a.tier] || 99) - (order[b.tier] || 99);
    });

  if (active.length === 0) {
    return [new EmbedBuilder()
      .setAuthor({ name: 'Void Fissures' })
      .setDescription('No active fissures.')
      .setColor(0x2B2D31)];
  }

  const grouped = {};
  for (const f of active) {
    const tier = getTier(f.tier);
    if (!grouped[f.tier]) grouped[f.tier] = { tier, fissures: [] };
    grouped[f.tier].fissures.push(f);
  }

  const embeds = [];
  for (const key of ['VoidT1', 'VoidT2', 'VoidT3', 'VoidT4', 'VoidT5', 'VoidT6']) {
    const group = grouped[key];
    if (!group) continue;

    const lines = group.fissures.map(f => {
      const mission = getMissionType(f.missionType);
      const region = f.region !== null ? getRegion(f.region) : '';
      return `**${mission}** \u2022 ${region} \u2022 ends <t:${toUnix(f.expiry)}:R>`;
    });

    embeds.push(new EmbedBuilder()
      .setAuthor({ name: `${group.tier.emoji} ${group.tier.name}` })
      .setDescription(lines.join('\n'))
      .setColor(TIER_COLORS[key] || 0x4A90D9)
    );
  }
  return embeds;
}

// ─── BARO ────────────────────────────────────────────

export function buildBaroEmbed(trader) {
  if (!trader) {
    return new EmbedBuilder()
      .setAuthor({ name: "Baro Ki'Teer" })
      .setDescription('Data unavailable.')
      .setColor(0xDAA520);
  }

  const now = Date.now();
  const isActive = trader.activation <= now && trader.expiry > now;
  const isUpcoming = trader.activation > now;
  const location = getNodeName(trader.node);

  if (isUpcoming) {
    return new EmbedBuilder()
      .setAuthor({ name: "Baro Ki'Teer \u2500 En Route" })
      .setDescription(
        `**${location}**\n` +
        `Arrives <t:${toUnix(trader.activation)}:R> \u2022 <t:${toUnix(trader.activation)}:F>`
      )
      .setColor(0xDAA520);
  }

  if (isActive) {
    let desc = `**${location}**\nDeparts <t:${toUnix(trader.expiry)}:R>`;
    if (trader.inventory?.length > 0) {
      const lines = trader.inventory.map(i => {
        const name = getItemName(i.ItemType);
        return `${name} \u2022 ${i.PrimePrice || '?'}dc \u2022 ${i.RegularPrice || '?'}cr`;
      });
      desc += '\n\n' + lines.join('\n');
    }
    return new EmbedBuilder()
      .setAuthor({ name: "Baro Ki'Teer \u2500 At Relay" })
      .setDescription(desc)
      .setColor(0xFFD700);
  }

  return new EmbedBuilder()
    .setAuthor({ name: "Baro Ki'Teer \u2500 Departed" })
    .setDescription(`Left **${location}** \u2022 Returns in ~2 weeks`)
    .setColor(0x808080);
}

// ─── SORTIE ──────────────────────────────────────────

export function buildSortieEmbed(sortie) {
  if (!sortie) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Sortie' })
      .setDescription('No active sortie.')
      .setColor(0x2B2D31);
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
    .setColor(0xE74C3C);
}

// ─── ARCHON HUNT ─────────────────────────────────────

export function buildArchonEmbed(archon) {
  if (!archon) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Archon Hunt' })
      .setDescription('No active Archon Hunt.')
      .setColor(0x2B2D31);
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
    .setColor(0x9B59B6);
}

// ─── INVASIONS ───────────────────────────────────────

export function buildInvasionEmbed(invasions) {
  if (!invasions || invasions.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Invasions' })
      .setDescription('No active invasions.')
      .setColor(0x2B2D31);
  }

  const lines = invasions.map(inv => {
    const details = getNodeDetails(inv.node);
    const node = details.value || inv.node;
    const atk = getFaction(inv.attackerFaction);
    const def = getFaction(inv.defenderFaction);
    const atkReward = getItemName(inv.attackerReward);
    const defReward = getItemName(inv.defenderReward);

    // Progress bar: attacker on left, defender on right
    const ratio = (inv.count + inv.goal) / (inv.goal * 2);
    const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    const barLen = 12;
    const atkFill = Math.round(((100 - pct) / 100) * barLen);
    const defFill = barLen - atkFill;
    const bar = '█'.repeat(atkFill) + '░'.repeat(defFill);

    const atkLabel = atkReward !== 'Unknown' ? atkReward : atk.name;
    const defLabel = defReward !== 'Unknown' ? defReward : def.name;

    return `**${node}**\n` +
      `${atk.emoji} ${atkLabel} ${bar} ${def.emoji} ${defLabel}`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: `Invasions \u2500 ${invasions.length} Active` })
    .setDescription(lines.join('\n\n'))
    .setColor(0xE67E22);
}

// ─── VOID STORMS ─────────────────────────────────────

export function buildVoidStormEmbed(storms) {
  if (!storms || storms.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Void Storms' })
      .setDescription('No active void storms.')
      .setColor(0x2B2D31);
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
    const tier = s.tier ? getTier(s.tier) : { emoji: '⬜', name: '?' };
    return `${tier.emoji} **${tier.name}** \u2022 ${node} \u2022 ${missionType} \u2022 ends <t:${toUnix(s.expiry)}:R>`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: `Void Storms \u2500 ${active.length} Active` })
    .setDescription(lines.join('\n') || 'No active storms.')
    .setColor(0x3498DB);
}

// ─── CYCLES ──────────────────────────────────────────

export function buildCycleEmbed(cycles) {
  if (!cycles) {
    return new EmbedBuilder()
      .setAuthor({ name: 'World Cycles' })
      .setDescription('Cycle data unavailable.')
      .setColor(0x2B2D31);
  }

  const fmt = (secs) => {
    const m = Math.floor(secs / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  const earth = cycles.earth.isDay ? '☀️ Day' : '🌙 Night';
  const cetus = cycles.cetus.isDay ? '☀️ Day' : '🌙 Night';
  const vallis = cycles.vallis.isWarm ? '🔥 Warm' : '❄️ Cold';
  const cambion = cycles.cambion.isFass ? '☀️ Fass' : '🌙 Vome';

  return new EmbedBuilder()
    .setAuthor({ name: 'World Cycles' })
    .setDescription(
      `**Earth** ${earth} \u2022 ${fmt(cycles.earth.remaining)}\n` +
      `**Cetus** ${cetus} \u2022 ${fmt(cycles.cetus.remaining)}\n` +
      `**Orb Vallis** ${vallis} \u2022 ${fmt(cycles.vallis.remaining)}\n` +
      `**Cambion Drift** ${cambion} \u2022 ${fmt(cycles.cambion.remaining)}`
    )
    .setColor(0x2ECC71);
}

// ─── DARVO DEAL ──────────────────────────────────────

export function buildDarvoEmbed(deal) {
  if (!deal) {
    return new EmbedBuilder()
      .setAuthor({ name: "Darvo's Deal" })
      .setDescription('No active deal.')
      .setColor(0x2B2D31);
  }

  const item = getItemName(deal.item);
  const remaining = deal.total - deal.sold;
  const stockText = remaining <= 0
    ? '**SOLD OUT**'
    : `${remaining}/${deal.total} remaining`;

  return new EmbedBuilder()
    .setAuthor({ name: "Darvo's Deal" })
    .setDescription(
      `**${item}**\n` +
      (deal.discount ? `**${deal.discount}% off** \u2022 ` : '') +
      (deal.salePrice ? `${deal.salePrice}p ` : '') +
      (deal.originalPrice ? `~~${deal.originalPrice}p~~` : '') +
      `\n${stockText}` +
      `\nEnds <t:${toUnix(deal.expiry)}:R>`
    )
    .setColor(remaining <= 0 ? 0x808080 : 0x1ABC9C);
}

// ─── NIGHTWAVE ───────────────────────────────────────

export function buildNightwaveEmbed(nightwave) {
  if (!nightwave || nightwave.challenges.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Nightwave' })
      .setDescription('No active challenges.')
      .setColor(0x2B2D31);
  }

  const now = Date.now();
  const active = nightwave.challenges.filter(c => c.expiry > now);

  // Separate by type
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

  if (dailies.length > 0) {
    sections.push('__Daily__\n' + dailies.map(formatChallenge).join('\n'));
  }
  if (weeklies.length > 0) {
    sections.push('__Weekly__\n' + weeklies.map(formatChallenge).join('\n'));
  }
  if (elites.length > 0) {
    sections.push('__Elite Weekly__\n' + elites.map(formatChallenge).join('\n'));
  }

  return new EmbedBuilder()
    .setAuthor({ name: `Nightwave \u2500 ${active.length} Challenges` })
    .setDescription(sections.join('\n\n') || 'No active challenges.')
    .setColor(0x8E44AD);
}

// ─── CIRCUIT ─────────────────────────────────────────

export function buildCircuitEmbed(circuit) {
  if (!circuit || circuit.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'The Circuit' })
      .setDescription('No circuit data.')
      .setColor(0x2B2D31);
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
    .setColor(0xF39C12);
}

// ─── ALERTS ──────────────────────────────────────────

export function buildAlertEmbed(alerts) {
  if (!alerts || alerts.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Alerts' })
      .setDescription('No active alerts.')
      .setColor(0x2B2D31);
  }

  const now = Date.now();
  const active = alerts.filter(a => a.expiry > now);

  if (active.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Alerts' })
      .setDescription('No active alerts.')
      .setColor(0x2B2D31);
  }

  const lines = active.map(a => {
    const mission = a.mission;
    const type = getMissionType(mission?.missionType || '');
    const node = getNodeName(mission?.location || '');
    const reward = mission?.missionReward;
    let rewardText = '';
    if (reward?.items?.length) rewardText = reward.items.map(i => getItemName(i)).join(', ');
    if (reward?.credits) rewardText += (rewardText ? ' + ' : '') + `${reward.credits}cr`;
    return `**${type}** \u2022 ${node}\n\u2003${rewardText || 'No reward listed'} \u2022 ends <t:${toUnix(a.expiry)}:R>`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: `Alerts \u2500 ${active.length} Active` })
    .setDescription(lines.join('\n\n'))
    .setColor(0xF1C40F);
}

// ─── GLOBAL BOOSTERS ─────────────────────────────────

const BOOSTER_NAMES = {
  GAMEPLAY_MONEY_REWARD_AMOUNT: 'Credits',
  GAMEPLAY_PICKUP_AMOUNT: 'Resources',
  GAMEPLAY_AFFINITY_AMOUNT: 'Affinity',
  GAMEPLAY_MOD_REWARD_AMOUNT: 'Mod Drop Rate',
};

export function buildBoosterEmbed(boosters) {
  if (!boosters || boosters.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Global Boosters' })
      .setDescription('No active boosters.')
      .setColor(0x2B2D31);
  }

  const now = Date.now();
  const active = boosters.filter(b => b.expiry > now);

  if (active.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: 'Global Boosters' })
      .setDescription('No active boosters.')
      .setColor(0x2B2D31);
  }

  const lines = active.map(b => {
    const name = BOOSTER_NAMES[b.type] || b.type;
    const mult = b.operation === 'MULTIPLY' ? `${b.value}x` : `+${b.value}`;
    return `**${mult} ${name}**\nExpires <t:${toUnix(b.expiry)}:R>`;
  });

  return new EmbedBuilder()
    .setAuthor({ name: `Global Boosters \u2500 ${active.length} Active` })
    .setDescription(lines.join('\n\n'))
    .setColor(0x00FF88);
}

// ─── EVENTS / TACTICAL ALERTS ────────────────────────

const EVENT_COLORS = {
  anniversary: 0xF1C40F,   // Gold for anniversary/dex
  operation: 0xFF6B6B,     // Red for operations
  default: 0x3498DB,       // Blue fallback
};

function getEventColor(tag) {
  if (!tag) return EVENT_COLORS.default;
  const t = tag.toLowerCase();
  if (t.includes('anniversary') || t.includes('dex')) return EVENT_COLORS.anniversary;
  if (t.includes('operation') || t.includes('event')) return EVENT_COLORS.operation;
  return EVENT_COLORS.default;
}

export function buildEventEmbeds(events) {
  if (!events || events.length === 0) {
    return [new EmbedBuilder()
      .setAuthor({ name: 'Events' })
      .setDescription('No active events.')
      .setColor(0x2B2D31)];
  }

  const now = Date.now();
  const active = events.filter(e => e.expiry > now);

  if (active.length === 0) {
    return [new EmbedBuilder()
      .setAuthor({ name: 'Events' })
      .setDescription('No active events.')
      .setColor(0x2B2D31)];
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
      const barLen = 10;
      const filled = Math.round((pct / 100) * barLen);
      desc += `**Progress** \u2022 ${'█'.repeat(filled)}${'░'.repeat(barLen - filled)} ${pct}%\n`;
    }
    if (e.community) desc += '**Type** \u2022 Community event\n';
    desc += `**Ends** \u2022 <t:${toUnix(e.expiry)}:R> \u2022 <t:${toUnix(e.expiry)}:f>`;

    return new EmbedBuilder()
      .setAuthor({ name: name })
      .setDescription(desc)
      .setColor(getEventColor(e.tag));
  });
}
