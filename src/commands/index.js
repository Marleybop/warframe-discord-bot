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
import {
  postRivenForm, handleAlphaSelect, handleWeaponSelect,
  handleAddStat, handleStatSelect, handleSearchNow, handleRestart,
} from './riven-form.js';
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

// Button handlers
const buttons = {
  riven_search_now: handleSearchNow,
  riven_add_stat: handleAddStat,
  riven_restart: handleRestart,
};

// Select menu handlers
const selects = {
  riven_alpha: handleAlphaSelect,
  riven_weapon: handleWeaponSelect,
  riven_weapon_2: handleWeaponSelect,
  riven_stat_positive: handleStatSelect,
};

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
    const handler = buttons[interaction.customId];
    if (handler) {
      try { await handler(interaction); } catch (err) {
        console.error(`[button:${interaction.customId}] Error:`, err.message);
      }
    }
    return;
  }

  // Select menus
  if (interaction.isStringSelectMenu()) {
    const handler = selects[interaction.customId];
    if (handler) {
      try { await handler(interaction); } catch (err) {
        console.error(`[select:${interaction.customId}] Error:`, err.message);
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
