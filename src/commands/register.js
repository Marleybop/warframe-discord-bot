#!/usr/bin/env node
// Manual command registration (also runs automatically on bot startup)
//   node src/commands/register.js

import { REST, Routes } from 'discord.js';
import '../config.js';
import { commandDefinitions } from './definitions.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Set DISCORD_TOKEN and CLIENT_ID in .env');
  process.exit(1);
}

const rest = new REST().setToken(TOKEN);

try {
  console.log(`Registering ${commandDefinitions.length} slash commands...`);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefinitions });
  console.log('Slash commands registered successfully!');
} catch (err) {
  console.error('Failed to register commands:', err);
}
