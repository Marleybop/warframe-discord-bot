import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency)
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

export const TOKEN = process.env.DISCORD_TOKEN;
export const INTERVAL = (Number(process.env.REFRESH_INTERVAL_SECONDS) || 60) * 1000;
export const DATA_DIR = resolve(__dirname, '..', 'data');

// Channel IDs — each tracker key maps to an env var
export const CHANNELS = {
  fissures:    process.env.FISSURE_CHANNEL_ID,
  baro:        process.env.BARO_CHANNEL_ID,
  sortie:      process.env.SORTIE_CHANNEL_ID,
  archon:      process.env.ARCHON_CHANNEL_ID,
  invasions:   process.env.INVASIONS_CHANNEL_ID,
  storms:      process.env.STORMS_CHANNEL_ID,
  cycles:      process.env.CYCLES_CHANNEL_ID,
  darvo:       process.env.DARVO_CHANNEL_ID,
  nightwave:   process.env.NIGHTWAVE_CHANNEL_ID,
  circuit:     process.env.CIRCUIT_CHANNEL_ID,
  alerts:      process.env.ALERTS_CHANNEL_ID,
  boosters:    process.env.BOOSTERS_CHANNEL_ID,
  events:      process.env.EVENTS_CHANNEL_ID,
  varzia:      process.env.VARZIA_CHANNEL_ID,
  archimedea:  process.env.ARCHIMEDEA_CHANNEL_ID,
  fomorian:    process.env.FOMORIAN_CHANNEL_ID,
  steelpath:   process.env.STEELPATH_CHANNEL_ID,
  news:        process.env.NEWS_CHANNEL_ID,
  simaris:     process.env.SIMARIS_CHANNEL_ID,
  calendar:    process.env.CALENDAR_CHANNEL_ID,
};
