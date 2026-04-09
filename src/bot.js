import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { TOKEN, INTERVAL, CHANNELS } from './config.js';
import { fetchWorldState } from './services/warframe-api.js';
import { trackers } from './trackers/index.js';
import { handleInteraction, commandDefinitions } from './commands/index.js';
import { buildGuideEmbeds } from './commands/guide.js';

if (!TOKEN || TOKEN === 'YOUR_TOKEN_HERE') {
  console.error('Set DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Track bot messages per tracker so we edit instead of repost
const trackedMessages = {};

async function getOrCreateMessage(channel, key) {
  if (trackedMessages[key]) {
    try {
      await trackedMessages[key].fetch();
      return trackedMessages[key];
    } catch {
      trackedMessages[key] = null;
    }
  }

  const messages = await channel.messages.fetch({ limit: 20 });
  const botMsg = messages.find(m => m.author.id === client.user.id);
  if (botMsg) {
    trackedMessages[key] = botMsg;
    return botMsg;
  }

  const msg = await channel.send({ content: 'Loading...' });
  trackedMessages[key] = msg;
  return msg;
}

async function updateChannel(key, result) {
  const channelId = CHANNELS[key];
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId);

    // Support both plain embeds and { embeds, files } from async builders
    const resolved = await Promise.resolve(result);
    let embedArray, files;
    if (resolved && !Array.isArray(resolved) && resolved.embeds) {
      embedArray = resolved.embeds;
      files = resolved.files || [];
    } else {
      embedArray = Array.isArray(resolved) ? resolved : [resolved];
      files = [];
    }

    const last = embedArray[embedArray.length - 1];
    if (last) last.setFooter({ text: 'Last updated' }).setTimestamp();
    const msg = await getOrCreateMessage(channel, key);
    await msg.edit({ content: '', embeds: embedArray, files });
  } catch (err) {
    console.error(`[${key}] Update failed:`, err.message);
  }
}

async function updateFeed(key, result) {
  const channelId = CHANNELS[key];
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId);
    const items = await Promise.resolve(result);
    if (!items || !Array.isArray(items) || items.length === 0) return;

    // Post each new item as a separate message
    for (const item of items) {
      const embed = item.embed || item;
      await channel.send({ embeds: [embed] });
    }
    console.log(`[${key}] Posted ${items.length} new items`);
  } catch (err) {
    console.error(`[${key}] Feed update failed:`, err.message);
  }
}

async function updateTrackers() {
  const ws = await fetchWorldState();
  if (!ws) {
    console.warn('[Update] Failed to fetch worldstate, skipping cycle');
    return;
  }

  // Run all enabled trackers in parallel
  const enabled = trackers.filter(t => CHANNELS[t.key]);
  const standard = enabled.filter(t => !t.feed);
  const feeds = enabled.filter(t => t.feed);

  // Standard trackers: extract → build → edit single message
  await Promise.all(
    standard.map(t => {
      const data = t.extract(ws);
      return updateChannel(t.key, t.build(data));
    })
  );

  // Feed trackers: post new messages for each new item
  await Promise.all(
    feeds.map(t => updateFeed(t.key, t.build(t.extract(ws))))
  );

  const active = trackers.filter(t => CHANNELS[t.key]).map(t => t.key);
  console.log(`[Update] ${new Date().toLocaleTimeString()} | ${active.join(', ')}`);
}

// Auto-register slash commands on startup
async function registerCommands() {
  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    console.warn('[Commands] CLIENT_ID not set, skipping command registration');
    return;
  }

  try {
    const rest = new REST().setToken(TOKEN);
    const guildId = process.env.GUILD_ID;
    if (guildId) {
      // Guild commands — instant propagation. Clear stale global commands.
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandDefinitions });
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      console.log(`[Commands] Registered ${commandDefinitions.length} guild slash commands`);
    } else {
      // Global commands — can take up to an hour to propagate
      await rest.put(Routes.applicationCommands(clientId), { body: commandDefinitions });
      console.log(`[Commands] Registered ${commandDefinitions.length} global slash commands`);
    }
  } catch (err) {
    console.error('[Commands] Registration failed:', err.message);
  }
}

// Schedule WFCD data updates (every 24h)
function scheduleDataUpdates() {
  const DAY = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    console.log('[Data] Running scheduled data update...');
    try {
      // Dynamic import so it runs as a fresh script
      const { execSync } = await import('child_process');
      execSync('node scripts/update-data.js', { stdio: 'inherit' });
    } catch (err) {
      console.error('[Data] Scheduled update failed:', err.message);
    }
  }, DAY);
  console.log(`[Data] Next auto-update in 24h`);
}

// Handle slash command interactions
client.on('interactionCreate', handleInteraction);

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register slash commands
  await registerCommands();

  const active = trackers.filter(t => CHANNELS[t.key]);
  if (active.length === 0) {
    console.warn('No channel IDs set! Add channel IDs to .env');
  } else {
    console.log('Active trackers:', active.map(t => t.key).join(', '));
  }
  console.log(`Refresh: ${INTERVAL / 1000}s`);

  // Post bot guide to commands channel if configured
  if (CHANNELS.botCommands) {
    try {
      const ch = await client.channels.fetch(CHANNELS.botCommands);
      const msgs = await ch.messages.fetch({ limit: 10 });
      const hasGuide = msgs.some(m => m.author.id === client.user.id && m.embeds.length >= 4);
      if (!hasGuide) {
        await ch.send({ embeds: buildGuideEmbeds() });
        console.log('[Guide] Posted bot guide');
      }
    } catch (err) {
      console.error('[Guide] Failed:', err.message);
    }
  }

  await updateTrackers();
  setInterval(updateTrackers, INTERVAL);
  scheduleDataUpdates();
});

client.login(TOKEN);
