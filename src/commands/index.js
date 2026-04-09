// Command registry — maps command names to handler modules

import { price } from './price.js';
import { where } from './where.js';
import { relic } from './relic.js';
import { handleAutocomplete } from './autocomplete.js';

const commands = new Map();
commands.set('price', price);
commands.set('where', where);
commands.set('relic', relic);

export async function handleInteraction(interaction) {
  if (interaction.isAutocomplete()) {
    try {
      await handleAutocomplete(interaction);
    } catch (err) {
      console.error('[autocomplete] Error:', err.message);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const handler = commands.get(interaction.commandName);
  if (!handler) return;

  try {
    await handler(interaction);
  } catch (err) {
    console.error(`[/${interaction.commandName}] Error:`, err.message);
    const reply = { content: 'Something went wrong. Try again.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
