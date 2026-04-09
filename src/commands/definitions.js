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

  new SlashCommandBuilder()
    .setName('warframe')
    .setDescription('Look up a Warframe — stats, abilities, and how to farm')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Warframe name (e.g. "Saryn Prime")')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('weapon')
    .setDescription('Look up a weapon — stats, damage, and how to farm')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Weapon name (e.g. "Acceltra")')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Look up a mod — stats per rank and drop sources')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Mod name (e.g. "Condition Overload")')
        .setRequired(true)
        .setAutocomplete(true)
    ),
].map(cmd => cmd.toJSON());
