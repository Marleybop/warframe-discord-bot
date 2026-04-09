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

  new SlashCommandBuilder()
    .setName('ducats')
    .setDescription('Check ducat value of a Prime part, or see top ducat items')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Item name (leave empty for top ducat values)')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('riven')
    .setDescription('Search riven auctions for a weapon')
    .addStringOption(opt =>
      opt.setName('weapon')
        .setDescription('Weapon name (e.g. "Braton")')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName('positive')
        .setDescription('Desired positive stat (e.g. "critical_chance")')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName('negative')
        .setDescription('Desired negative stat (e.g. "damage_vs_infested")')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('max_price')
        .setDescription('Maximum buyout price in platinum')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('max_rolls')
        .setDescription('Maximum number of re-rolls')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('sort')
        .setDescription('Sort results by')
        .setRequired(false)
        .addChoices(
          { name: 'Price (low to high)', value: 'price_asc' },
          { name: 'Price (high to low)', value: 'price_desc' },
        )
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all bot commands and features'),

].map(cmd => cmd.toJSON());
