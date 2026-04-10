import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getItemName, getItemImageUrl } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed, COLORS } from '../utils/embed-helpers.js';
import { e } from '../utils/emojis.js';

export const key = 'darvo';

export function extract(ws) {
  const deals = ws.DailyDeals || [];
  if (deals.length === 0) return null;
  const d = deals[0];
  return {
    item: d.StoreItem,
    activation: parseDate(d.Activation),
    expiry: parseDate(d.Expiry),
    discount: d.Discount,
    originalPrice: d.OriginalPrice,
    salePrice: d.SalePrice,
    total: d.AmountTotal,
    sold: d.AmountSold,
  };
}

export function build(deal) {
  if (!deal) {
    return emptyEmbed("Darvo's Deal", 'No active deal.');
  }

  const item = getItemName(deal.item);
  const remaining = deal.total - deal.sold;
  const stockText = remaining <= 0
    ? '**SOLD OUT**'
    : `${remaining}/${deal.total} remaining`;

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Darvo's Deal" })
    .setDescription(
      `**${item}**\n` +
      (deal.discount ? `**${deal.discount}% off** \u2022 ` : '') +
      (deal.salePrice ? `${deal.salePrice} ${e('platinum')}p ` : '') +
      (deal.originalPrice ? `~~${deal.originalPrice}p~~` : '') +
      `\n${stockText}` +
      `\nEnds <t:${toUnix(deal.expiry)}:R>`
    )
    .setColor(remaining <= 0 ? COLORS.DARVO_SOLD : COLORS.DARVO_ACTIVE);

  const img = getItemImageUrl(deal.item);
  if (img) embed.setImage(img);

  return embed;
}
