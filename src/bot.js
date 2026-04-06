import { Client, GatewayIntentBits } from 'discord.js';
import {
  fetchWorldState, extractFissures, extractVoidTrader,
  extractSortie, extractArchonHunt, extractInvasions,
  extractVoidStorms, extractNightwave, extractDailyDeal,
  extractCycles, extractCircuit,
  extractAlerts, extractGlobalBoosters, extractEvents,
} from './api.js';
import {
  buildFissureEmbeds, buildBaroEmbed, buildSortieEmbed,
  buildArchonEmbed, buildInvasionEmbed, buildVoidStormEmbed,
  buildCycleEmbed, buildDarvoEmbed, buildNightwaveEmbed,
  buildCircuitEmbed, buildAlertEmbed, buildBoosterEmbed,
  buildEventEmbed,
} from './embeds.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually (no dotenv dependency)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn('[ENV] No .env file found, using environment variables');
}

const TOKEN = process.env.DISCORD_TOKEN;
const INTERVAL = (Number(process.env.REFRESH_INTERVAL_SECONDS) || 60) * 1000;

if (!TOKEN || TOKEN === 'YOUR_TOKEN_HERE') {
  console.error('Set DISCORD_TOKEN in .env');
  process.exit(1);
}

// Channel config — each tracker gets its own channel (or shares one)
const CHANNELS = {
  fissures:  process.env.FISSURE_CHANNEL_ID,
  baro:      process.env.BARO_CHANNEL_ID,
  sortie:    process.env.SORTIE_CHANNEL_ID,
  archon:    process.env.ARCHON_CHANNEL_ID,
  invasions: process.env.INVASIONS_CHANNEL_ID,
  storms:    process.env.STORMS_CHANNEL_ID,
  cycles:    process.env.CYCLES_CHANNEL_ID,
  darvo:     process.env.DARVO_CHANNEL_ID,
  nightwave: process.env.NIGHTWAVE_CHANNEL_ID,
  circuit:   process.env.CIRCUIT_CHANNEL_ID,
  alerts:    process.env.ALERTS_CHANNEL_ID,
  boosters:  process.env.BOOSTERS_CHANNEL_ID,
  events:    process.env.EVENTS_CHANNEL_ID,
};

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

async function updateChannel(key, embeds) {
  const channelId = CHANNELS[key];
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId);
    const embedArray = Array.isArray(embeds) ? embeds : [embeds];
    // Stamp the last embed with "Last updated" timestamp
    const last = embedArray[embedArray.length - 1];
    if (last) last.setFooter({ text: 'Last updated' }).setTimestamp();
    const msg = await getOrCreateMessage(channel, key);
    await msg.edit({ content: '', embeds: embedArray });
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

  // Build all embeds from worldstate
  await Promise.all([
    updateChannel('fissures',  buildFissureEmbeds(extractFissures(ws))),
    updateChannel('baro',      buildBaroEmbed(extractVoidTrader(ws))),
    updateChannel('sortie',    buildSortieEmbed(extractSortie(ws))),
    updateChannel('archon',    buildArchonEmbed(extractArchonHunt(ws))),
    updateChannel('invasions', buildInvasionEmbed(extractInvasions(ws))),
    updateChannel('storms',    buildVoidStormEmbed(extractVoidStorms(ws))),
    updateChannel('cycles',    buildCycleEmbed(extractCycles(ws))),
    updateChannel('darvo',     buildDarvoEmbed(extractDailyDeal(ws))),
    updateChannel('nightwave', buildNightwaveEmbed(extractNightwave(ws))),
    updateChannel('circuit',   buildCircuitEmbed(extractCircuit(ws))),
    updateChannel('alerts',    buildAlertEmbed(extractAlerts(ws))),
    updateChannel('boosters',  buildBoosterEmbed(extractGlobalBoosters(ws))),
    updateChannel('events',    buildEventEmbed(extractEvents(ws))),
  ]);

  const active = Object.entries(CHANNELS).filter(([, v]) => v).map(([k]) => k);
  console.log(`[Update] ${new Date().toLocaleTimeString()} | ${active.join(', ')}`);
}

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const active = Object.entries(CHANNELS).filter(([, v]) => v);
  if (active.length === 0) {
    console.warn('No channel IDs set! Add channel IDs to .env');
  } else {
    console.log('Active trackers:', active.map(([k]) => k).join(', '));
  }
  console.log(`Refresh: ${INTERVAL / 1000}s`);

  await updateTrackers();
  setInterval(updateTrackers, INTERVAL);
});

client.login(TOKEN);
