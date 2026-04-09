import { EmbedBuilder } from 'discord.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../config.js';

const vaultedPath = resolve(DATA_DIR, 'vaulted.json');
const vaultedData = existsSync(vaultedPath)
  ? JSON.parse(readFileSync(vaultedPath, 'utf8'))
  : {};

// Map WFCD categories to friendlier names
const CATEGORY_LABELS = {
  Warframes: 'Warframes',
  Primary: 'Primary Weapons',
  Secondary: 'Secondary Weapons',
  Melee: 'Melee Weapons',
  Sentinels: 'Sentinels',
  Pets: 'Companions',
  Archwing: 'Archwing',
  Weapons: 'Weapons',
  Relics: 'Relics',
};

export async function vaulted(interaction) {
  const category = interaction.options.getString('category');

  if (!category || category === 'all') {
    // Show summary of all categories
    const lines = [];
    for (const [cat, items] of Object.entries(vaultedData)) {
      const label = CATEGORY_LABELS[cat] || cat;
      lines.push(`**${label}** \u2022 ${items.length} vaulted`);
    }

    if (lines.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setDescription('No vaulted items data. Run `npm run update-data` first.')
          .setColor(0xFF0000)],
        ephemeral: true,
      });
    }

    const total = Object.values(vaultedData).reduce((sum, arr) => sum + arr.length, 0);
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setAuthor({ name: 'Prime Vault' })
        .setTitle(`${total} Vaulted Items`)
        .setDescription(lines.join('\n') + '\n\nUse `/vaulted <category>` to see the full list.')
        .setColor(0xD4AF37)],
    });
  }

  // Find matching category (case-insensitive)
  const lower = category.toLowerCase();
  const matchedKey = Object.keys(vaultedData).find(k => k.toLowerCase() === lower)
    || Object.keys(vaultedData).find(k => k.toLowerCase().includes(lower))
    || Object.keys(CATEGORY_LABELS).find(k => CATEGORY_LABELS[k].toLowerCase().includes(lower));

  const items = vaultedData[matchedKey];
  if (!items || items.length === 0) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setDescription(`No vaulted items found for category **${category}**`)
        .setColor(0xFF0000)],
      ephemeral: true,
    });
  }

  const label = CATEGORY_LABELS[matchedKey] || matchedKey;
  const sorted = [...items].sort();

  // Split into multiple embeds if needed (Discord 4096 char desc limit)
  const embeds = [];
  let current = [];
  let currentLen = 0;

  for (const name of sorted) {
    const line = `\u2022 ${name}`;
    if (currentLen + line.length + 1 > 3900 || current.length >= 40) {
      embeds.push(current.join('\n'));
      current = [];
      currentLen = 0;
    }
    current.push(line);
    currentLen += line.length + 1;
  }
  if (current.length > 0) embeds.push(current.join('\n'));

  const result = embeds.map((desc, i) => {
    const embed = new EmbedBuilder()
      .setDescription(desc)
      .setColor(0xD4AF37);
    if (i === 0) {
      embed.setAuthor({ name: 'Prime Vault' });
      embed.setTitle(`${label} \u2500 ${items.length} Vaulted`);
    }
    return embed;
  });

  await interaction.reply({ embeds: result.slice(0, 10) });
}
