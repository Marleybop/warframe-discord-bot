import { SlashCommandBuilder } from 'discord.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('price')
    .setDescription('Check warframe.market prices for an item')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Item name (e.g. "Nikana Prime Set")')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('where')
    .setDescription('Find where an item drops')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Item name (e.g. "Condition Overload")')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('relic')
    .setDescription('Show relic contents and drop chances')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Relic name (e.g. "Lith M7")')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('vaulted')
    .setDescription('Show vaulted Prime items')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Category (warframes, primary, secondary, melee) or leave empty for summary')
        .setRequired(false)
        .addChoices(
          { name: 'All (summary)', value: 'all' },
          { name: 'Warframes', value: 'Warframes' },
          { name: 'Primary Weapons', value: 'Primary' },
          { name: 'Secondary Weapons', value: 'Secondary' },
          { name: 'Melee Weapons', value: 'Melee' },
          { name: 'Sentinels', value: 'Sentinels' },
          { name: 'Archwing', value: 'Archwing' },
        )
    ),
].map(cmd => cmd.toJSON());
