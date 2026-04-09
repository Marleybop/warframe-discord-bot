import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getNodeName, getItemName, getItemImageUrl } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';

export const key = 'varzia';

export function extract(ws) {
  const traders = ws.PrimeVaultTraders || [];
  if (traders.length === 0) return null;
  const t = traders[0];
  return {
    node: t.Node,
    activation: parseDate(t.Activation),
    expiry: parseDate(t.Expiry),
    manifest: (t.Manifest || []).map(i => ({
      item: i.ItemType,
      primePrice: i.PrimePrice,
      regularPrice: i.RegularPrice,
    })),
    evergreen: (t.EvergreenManifest || []).map(i => ({
      item: i.ItemType,
      primePrice: i.PrimePrice,
      regularPrice: i.RegularPrice,
    })),
    schedule: (t.ScheduleInfo || []).map(s => ({
      expiry: parseDate(s.Expiry),
      featured: s.FeaturedItem,
    })),
  };
}

export function build(varzia) {
  if (!varzia) {
    return emptyEmbed('Varzia', 'No Prime Resurgence data.');
  }

  const embeds = [];

  // Featured/rotating items
  if (varzia.manifest.length > 0) {
    const lines = varzia.manifest.map(i => {
      const name = getItemName(i.item);
      const price = i.primePrice ? `${i.primePrice} Aya` : '';
      return `${name}${price ? ` \u2022 ${price}` : ''}`;
    });

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Varzia \u2500 ${varzia.manifest.length} Rotating Items` })
      .setDescription(lines.join('\n'))
      .setColor(0xD4AF37);

    // Show next rotation if schedule available
    const nextRotation = varzia.schedule.find(s => s.expiry > Date.now());
    if (nextRotation) {
      embed.setDescription(
        embed.data.description + `\n\n**Rotation ends** <t:${toUnix(nextRotation.expiry)}:R>`
      );
    }

    const img = getItemImageUrl(varzia.manifest[0]?.item);
    if (img) embed.setThumbnail(img);

    embeds.push(embed);
  }

  if (embeds.length === 0) {
    return emptyEmbed('Varzia', 'No items available.');
  }

  return embeds;
}
