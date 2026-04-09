import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getNodeDetails, getFaction, getItemName, getItemImageUrl } from '../utils/warframe-data.js';
import { emptyEmbed, COLORS } from '../utils/embed-helpers.js';
import { mergeImages } from '../utils/image-merge.js';

export const key = 'invasions';

export function extract(ws) {
  return (ws.Invasions || [])
    .filter(i => !i.Completed)
    .map(i => ({
      node: i.Node,
      attackerFaction: i.Faction,
      defenderFaction: i.DefenderFaction,
      attackerReward: i.AttackerReward?.countedItems?.[0]?.ItemType || null,
      defenderReward: i.DefenderReward?.countedItems?.[0]?.ItemType || null,
      progress: Math.abs(i.Count) / i.Goal,
      count: i.Count,
      goal: i.Goal,
      activation: parseDate(i.Activation),
    }));
}

export async function build(invasions) {
  if (!invasions || invasions.length === 0) {
    return { embeds: [emptyEmbed('Invasions', 'No active invasions.')] };
  }

  const embeds = [];
  const files = [];

  // Cap at 9 to leave room for the footer embed (Discord max 10 per message)
  const capped = invasions.slice(0, 9);

  await Promise.all(capped.map(async (inv, i) => {
    const details = getNodeDetails(inv.node);
    const node = details.value || inv.node;
    const atk = getFaction(inv.attackerFaction);
    const def = getFaction(inv.defenderFaction);
    const atkReward = getItemName(inv.attackerReward);
    const defReward = getItemName(inv.defenderReward);

    const ratio = (inv.count + inv.goal) / (inv.goal * 2);
    const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    const barLen = 12;
    const atkFill = Math.round(((100 - pct) / 100) * barLen);
    const defFill = barLen - atkFill;
    const bar = '\u2588'.repeat(atkFill) + '\u2591'.repeat(defFill);

    const atkLabel = atkReward !== 'Unknown' ? atkReward : atk.name;
    const defLabel = defReward !== 'Unknown' ? defReward : def.name;

    // Merge both reward images into one
    const atkImg = getItemImageUrl(inv.attackerReward);
    const defImg = getItemImageUrl(inv.defenderReward);
    const filename = `invasion-${i}.png`;
    let merged = null;
    try {
      merged = await mergeImages(atkImg, defImg);
    } catch { /* image merge failed, continue without */ }

    const embed = new EmbedBuilder()
      .setDescription(
        `**${node}**\n` +
        `${atk.emoji} ${atkLabel} ${bar} ${def.emoji} ${defLabel}`
      )
      .setColor(COLORS.INVASION);

    if (i === 0) embed.setAuthor({ name: `Invasions \u2500 ${invasions.length} Active` });

    if (merged) {
      const attachment = new AttachmentBuilder(merged.buffer, { name: filename });
      embed.setImage(`attachment://${filename}`);
      files.push(attachment);
    } else {
      const fallback = atkImg || defImg;
      if (fallback) embed.setImage(fallback);
    }

    // Store index so we can sort back into order after parallel resolution
    embeds[i] = embed;
  }));

  return { embeds, files };
}
