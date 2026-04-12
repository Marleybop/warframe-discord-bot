import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getNodeName, getItemName } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';
import { e } from '../utils/emojis.js';

const EMBED_DESC_LIMIT = 4096;
const BARO_THUMBNAIL = 'https://wiki.warframe.com/images/thumb/TennoCon2020BaroCropped.png/300px-TennoCon2020BaroCropped.png';

function shortNum(n) {
  if (n == null || n === '?') return '?';
  const v = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(v)) return '?';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}m`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`;
  return String(v);
}

export const key = 'baro';

export function extract(ws) {
  const traders = ws.VoidTraders || [];
  if (traders.length === 0) return null;
  const t = traders[0];
  return {
    character: t.Character,
    node: t.Node,
    activation: parseDate(t.Activation),
    expiry: parseDate(t.Expiry),
    inventory: t.Manifest || [],
  };
}

export function build(trader) {
  if (!trader) {
    return emptyEmbed("Baro Ki'Teer", 'Data unavailable.');
  }

  const now = Date.now();
  const isActive = trader.activation <= now && trader.expiry > now;
  const isUpcoming = trader.activation > now;
  const location = getNodeName(trader.node);

  if (isUpcoming) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Baro Ki'Teer \u2500 En Route" })
      .setDescription(
        `**${location}**\n` +
        `Arrives <t:${toUnix(trader.activation)}:R> \u2022 <t:${toUnix(trader.activation)}:F>`
      )
      .setColor(COLORS.BARO_WAITING);
    return embed;
  }

  if (isActive) {
    const header = `**${location}**\nDeparts <t:${toUnix(trader.expiry)}:R>`;

    if (!trader.inventory?.length) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Baro Ki'Teer \u2500 At Relay" })
        .setDescription(header)
        .setColor(COLORS.BARO_ACTIVE);
      return embed;
    }

    const lines = trader.inventory.map(i => {
      const name = getItemName(i.ItemType);
      return `${name} \u2022 ${shortNum(i.PrimePrice)} ${e('ducats')} \u2022 ${shortNum(i.RegularPrice)} ${e('credits')}`;
    });

    // Split lines into chunks that fit within embed description limit
    const embeds = [];
    let chunk = [];
    let chunkLen = 0;
    const overhead = header.length + 2; // '\n\n' between header and items

    for (const line of lines) {
      const addLen = chunk.length === 0 ? line.length : line.length + 1; // +1 for '\n'
      const baseLen = embeds.length === 0 ? overhead : 0;
      if (chunkLen + addLen + baseLen > EMBED_DESC_LIMIT && chunk.length > 0) {
        embeds.push(chunk);
        chunk = [];
        chunkLen = 0;
      }
      chunk.push(line);
      chunkLen += addLen;
    }
    if (chunk.length > 0) embeds.push(chunk);

    return embeds.map((items, i) => {
      const desc = i === 0
        ? header + '\n\n' + items.join('\n')
        : items.join('\n');
      const embed = new EmbedBuilder()
        .setAuthor({ name: i === 0 ? "Baro Ki'Teer \u2500 At Relay" : "Baro Ki'Teer \u2500 Continued" })
        .setDescription(desc)
        .setColor(COLORS.BARO_ACTIVE);
      if (i === 0) embed.setThumbnail(BARO_THUMBNAIL);
      return embed;
    });
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Baro Ki'Teer \u2500 Departed" })
    .setDescription(`Left **${location}** \u2022 Returns in ~2 weeks`)
    .setColor(COLORS.BARO_GONE);
  return embed;
}
