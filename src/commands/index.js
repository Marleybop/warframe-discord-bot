// Command registry — maps command names to handler modules

import { MessageFlags } from 'discord.js';
import { price } from './price.js';
import { where } from './where.js';
import { relic } from './relic.js';
import { vaulted } from './vaulted.js';
import { warframe } from './warframe.js';
import { weapon } from './weapon.js';
import { mod } from './mod.js';
import { ducats } from './ducats.js';
import { riven } from './riven.js';
import { help } from './help.js';
import { handleAutocomplete } from './autocomplete.js';
export { commandDefinitions } from './definitions.js';

const commands = new Map();
commands.set('price', price);
commands.set('where', where);
commands.set('relic', relic);
commands.set('vaulted', vaulted);
commands.set('warframe', warframe);
commands.set('weapon', weapon);
commands.set('mod', mod);
commands.set('ducats', ducats);
commands.set('riven', riven);
commands.set('help', help);

export async function handleInteraction(interaction) {
  // Autocomplete
  if (interaction.isAutocomplete()) {
    try {
      await handleAutocomplete(interaction);
    } catch (err) {
      console.error('[autocomplete] Error:', err.message);
    }
    return;
  }

  // Slash commands
  if (!interaction.isChatInputCommand()) return;

  const handler = commands.get(interaction.commandName);
  if (!handler) return;

  try {
    await handler(interaction);
  } catch (err) {
    console.error(`[/${interaction.commandName}] Error:`, err.message);
    const reply = { content: 'Something went wrong. Try again.', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
