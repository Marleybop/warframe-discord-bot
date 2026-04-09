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
import { postRivenForm, handleRivenOpen, handleRivenSubmit } from './riven-form.js';
import { handleAutocomplete } from './autocomplete.js';
export { commandDefinitions } from './definitions.js';
export { postRivenForm } from './riven-form.js';

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
commands.set('setup-riven', async (interaction) => {
  await postRivenForm(interaction.channel);
  await interaction.reply({ content: 'Riven search form posted!', flags: MessageFlags.Ephemeral });
});

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

  // Button clicks
  if (interaction.isButton()) {
    if (interaction.customId === 'riven_open') {
      try { await handleRivenOpen(interaction); } catch (err) {
        console.error('[button:riven_open] Error:', err.message);
      }
    }
    return;
  }

  // Modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'riven_submit') {
      try { await handleRivenSubmit(interaction); } catch (err) {
        console.error('[modal:riven_submit] Error:', err.message);
      }
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
