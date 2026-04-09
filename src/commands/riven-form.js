import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags,
} from 'discord.js';
import { getRivenAttributes } from './riven.js';
import { assetUrl } from '../services/market.js';
import { cached } from '../services/cache.js';

const V1_URL = 'https://api.warframe.market/v1';
const TTL_SEARCH = 5 * 60 * 1000;

// Post the persistent form button in a channel
export async function postRivenForm(channel) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search' })
    .setDescription('Click the button below to search for rivens.\nResults will be sent to your DMs.')
    .setColor(0x9B59B6);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('riven_form_open')
      .setLabel('Search Rivens')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('\u{1F50D}')
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// Handle the button click — show the modal
export async function handleRivenButton(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('riven_form_submit')
    .setTitle('Riven Search');

  const weapon = new TextInputBuilder()
    .setCustomId('weapon')
    .setLabel('Weapon Name')
    .setPlaceholder('e.g. Braton, Gram, Rubico')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const positive = new TextInputBuilder()
    .setCustomId('positive')
    .setLabel('Desired Positive Stat (optional)')
    .setPlaceholder('e.g. critical chance, damage, multishot')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const negative = new TextInputBuilder()
    .setCustomId('negative')
    .setLabel('Acceptable Negative Stat (optional)')
    .setPlaceholder('e.g. damage to infested, zoom')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const maxPrice = new TextInputBuilder()
    .setCustomId('max_price')
    .setLabel('Max Price in Platinum (optional)')
    .setPlaceholder('e.g. 500')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const maxRolls = new TextInputBuilder()
    .setCustomId('max_rolls')
    .setLabel('Max Re-rolls (optional)')
    .setPlaceholder('e.g. 10')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(weapon),
    new ActionRowBuilder().addComponents(positive),
    new ActionRowBuilder().addComponents(negative),
    new ActionRowBuilder().addComponents(maxPrice),
    new ActionRowBuilder().addComponents(maxRolls),
  );

  await interaction.showModal(modal);
}

// Handle modal submission — search and DM results
export async function handleRivenSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const weaponQuery = interaction.fields.getTextInputValue('weapon');
  const positiveQuery = interaction.fields.getTextInputValue('positive') || null;
  const negativeQuery = interaction.fields.getTextInputValue('negative') || null;
  const maxPriceStr = interaction.fields.getTextInputValue('max_price') || null;
  const maxRollsStr = interaction.fields.getTextInputValue('max_rolls') || null;

  const maxPrice = maxPriceStr ? parseInt(maxPriceStr) : null;
  const maxRolls = maxRollsStr ? parseInt(maxRollsStr) : null;

  // Find weapon
  const itemsRes = await fetch(`${V1_URL}/riven/items`, { headers: { Platform: 'pc' } });
  const itemsJson = await itemsRes.json();
  const items = itemsJson.payload.items;

  const lower = weaponQuery.toLowerCase();
  const weapon = items.find(i => i.item_name.toLowerCase() === lower)
    || items.find(i => i.item_name.toLowerCase().startsWith(lower))
    || items.find(i => i.item_name.toLowerCase().includes(lower));

  if (!weapon) {
    return interaction.editReply({ content: `**${weaponQuery}** is not a riven-eligible weapon.` });
  }

  // Resolve stat names
  const attributes = await getRivenAttributes();
  const resolveStat = (input) => {
    if (!input) return null;
    const l = input.toLowerCase();
    const attr = attributes.find(a => a.url_name === l)
      || attributes.find(a => a.effect?.toLowerCase() === l)
      || attributes.find(a => a.effect?.toLowerCase().includes(l));
    return attr?.url_name || null;
  };

  const positiveUrl = resolveStat(positiveQuery);
  const negativeUrl = resolveStat(negativeQuery);

  // Search auctions
  const params = new URLSearchParams({
    type: 'riven',
    weapon_url_name: weapon.url_name,
    sort_by: 'price_asc',
    buyout_policy: 'with',
  });
  if (positiveUrl) params.append('positive_stats', positiveUrl);
  if (negativeUrl) params.append('negative_stats', negativeUrl);

  const cacheKey = `riven:form:${weapon.url_name}:${params.toString()}`;
  let auctions;
  try {
    auctions = await cached(cacheKey, TTL_SEARCH, async () => {
      const res = await fetch(`${V1_URL}/auctions/search?${params}`, { headers: { Platform: 'pc' } });
      if (!res.ok) throw new Error(`auctions ${res.status}`);
      const json = await res.json();
      return json.payload.auctions;
    });
  } catch {
    return interaction.editReply({ content: 'Failed to search auctions. Try again.' });
  }

  // Filter locally
  let filtered = (auctions || []).filter(a => a.buyout_price && !a.closed);
  if (maxPrice && !isNaN(maxPrice)) filtered = filtered.filter(a => a.buyout_price <= maxPrice);
  if (maxRolls != null && !isNaN(maxRolls)) filtered = filtered.filter(a => (a.item?.re_rolls || 0) <= maxRolls);

  // Build result embed
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Riven Search Results' })
    .setTitle(`${weapon.item_name} Riven`)
    .setColor(0x9B59B6);

  if (weapon.thumb) embed.setThumbnail(assetUrl(weapon.thumb));

  const filters = [];
  if (positiveQuery) filters.push(`+${positiveQuery}`);
  if (negativeQuery) filters.push(`-${negativeQuery}`);
  if (maxPrice) filters.push(`\u2264${maxPrice}p`);
  if (maxRolls != null) filters.push(`\u2264${maxRolls} rolls`);
  const filterStr = filters.length > 0 ? `Filters: ${filters.join(' \u2022 ')}\n` : '';

  if (filtered.length === 0) {
    embed.setDescription(`${filterStr}No rivens found matching your criteria.`);
  } else {
    const top = filtered.slice(0, 8);

    const lines = top.map(a => {
      const stats = (a.item?.attributes || []).map(s => {
        const val = s.value > 0 ? `+${s.value}` : `${s.value}`;
        return `${val}% ${s.url_name.replace(/_/g, ' ')}`;
      }).join(', ');

      const rerolls = a.item?.re_rolls != null ? `${a.item.re_rolls} rolls` : '';
      const mr = a.item?.mastery_level ? `MR ${a.item.mastery_level}` : '';
      const meta = [mr, rerolls].filter(Boolean).join(' \u2022 ');
      const seller = a.owner?.ingame_name || '?';
      const status = a.owner?.status === 'ingame' ? ' \u{1F7E2}' : '';

      return `**${a.buyout_price}p**${meta ? ` \u2022 ${meta}` : ''}\n\u2003${stats}\n\u2003Seller: ${seller}${status}`;
    });

    const prices = top.map(a => a.buyout_price);
    const summary = `**${Math.min(...prices)}p** \u2013 **${Math.max(...prices)}p**`;

    embed.setDescription(
      `${filterStr}${filtered.length} listings \u2022 Buyouts from ${summary}\n\n` +
      lines.join('\n\n')
    );
  }

  // Send to DMs
  try {
    await interaction.user.send({ embeds: [embed] });
    await interaction.editReply({ content: 'Results sent to your DMs!' });
  } catch {
    // DMs might be closed — reply ephemerally instead
    await interaction.editReply({ embeds: [embed] });
  }
}
