#!/usr/bin/env node
// Run once to register slash commands with Discord:
//   node src/commands/register.js

import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import '../config.js'; // loads .env

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Set DISCORD_TOKEN and CLIENT_ID in .env');
  process.exit(1);
}

const commands = [
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
].map(cmd => cmd.toJSON());

const rest = new REST().setToken(TOKEN);

try {
  console.log(`Registering ${commands.length} slash commands...`);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Slash commands registered successfully!');
} catch (err) {
  console.error('Failed to register commands:', err);
}
