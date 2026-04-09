import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getNodeName, getItemName, getItemImageUrl } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';

// Relay node codes → planet thumbnail from the Warframe wiki
const RELAY_IMAGES = {
  MercuryHUB:  'https://wiki.warframe.com/images/Mercury.png',
  VenusHUB:    'https://wiki.warframe.com/images/Venus.png',
  EarthHUB:    'https://wiki.warframe.com/images/Earth.png',
  SaturnHUB:   'https://wiki.warframe.com/images/Saturn.png',
  ErisHUB:     'https://wiki.warframe.com/images/Eris.png',
  PlutoHUB:    'https://wiki.warframe.com/images/Pluto.png',
  EuropaHUB:   'https://wiki.warframe.com/images/Europa.png',
  NeptuneHUB:  'https://wiki.warframe.com/images/Neptune.png',
};

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
  const planetImg = RELAY_IMAGES[trader.node] || null;

  if (isUpcoming) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Baro Ki'Teer \u2500 En Route" })
      .setDescription(
        `**${location}**\n` +
        `Arrives <t:${toUnix(trader.activation)}:R> \u2022 <t:${toUnix(trader.activation)}:F>`
      )
      .setColor(COLORS.BARO_WAITING);
    if (planetImg) embed.setImage(planetImg);
    return embed;
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
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Baro Ki'Teer \u2500 At Relay" })
      .setDescription(desc)
      .setColor(COLORS.BARO_ACTIVE);
    if (planetImg) embed.setImage(planetImg);
    return embed;
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Baro Ki'Teer \u2500 Departed" })
    .setDescription(`Left **${location}** \u2022 Returns in ~2 weeks`)
    .setColor(COLORS.BARO_GONE);
  if (planetImg) embed.setImage(planetImg);
  return embed;
}
