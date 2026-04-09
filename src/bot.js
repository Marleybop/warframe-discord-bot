import { Client, GatewayIntentBits } from 'discord.js';
import { TOKEN, INTERVAL, CHANNELS } from './config.js';
import { fetchWorldState } from './services/warframe-api.js';
import { trackers } from './trackers/index.js';

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

async function updateTrackers() {
  const ws = await fetchWorldState();
  if (!ws) {
    console.warn('[Update] Failed to fetch worldstate, skipping cycle');
    return;
  }

  // Run all enabled trackers in parallel
  await Promise.all(
    trackers
      .filter(t => CHANNELS[t.key])
      .map(t => updateChannel(t.key, t.build(t.extract(ws))))
  );

  const active = trackers.filter(t => CHANNELS[t.key]).map(t => t.key);
  console.log(`[Update] ${new Date().toLocaleTimeString()} | ${active.join(', ')}`);
}

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const active = trackers.filter(t => CHANNELS[t.key]);
  if (active.length === 0) {
    console.warn('No channel IDs set! Add channel IDs to .env');
  } else {
    console.log('Active trackers:', active.map(t => t.key).join(', '));
  }
  console.log(`Refresh: ${INTERVAL / 1000}s`);

  await updateTrackers();
  setInterval(updateTrackers, INTERVAL);
});

client.login(TOKEN);
