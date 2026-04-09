import { EmbedBuilder } from 'discord.js';
import { emptyEmbed, formatDuration, COLORS } from '../utils/embed-helpers.js';
import { cached } from '../services/cache.js';

export const key = 'cycles';

const TTL = 60 * 1000; // 1 minute, matches refresh interval

async function fetchCycle(endpoint) {
  return cached(`tracker:${endpoint}`, TTL, async () => {
    const res = await fetch(`https://api.warframestat.us/pc/${endpoint}/`);
    if (!res.ok) throw new Error(`${endpoint} ${res.status}`);
    return res.json();
  });
}

export function extract(ws) {
  const time = ws.Time;

  const earthSec = time % 28800;
  const earthIsDay = earthSec < 14400;
  const earthRemaining = earthIsDay ? 14400 - earthSec : 28800 - earthSec;

  const cetusSec = (time + 3000) % 8998;
  const cetusIsDay = cetusSec < 6000;
  const cetusRemaining = cetusIsDay ? 6000 - cetusSec : 8998 - cetusSec;

  const vallisSec = time % 1600;
  const vallisIsWarm = vallisSec < 400;
  const vallisRemaining = vallisIsWarm ? 400 - vallisSec : 1600 - vallisSec;

  const cambionSec = time % 1800;
  const cambionIsFass = cambionSec < 900;
  const cambionRemaining = cambionIsFass ? 900 - cambionSec : 1800 - cambionSec;

  return {
    earth: { isDay: earthIsDay, remaining: earthRemaining },
    cetus: { isDay: cetusIsDay, remaining: cetusRemaining },
    vallis: { isWarm: vallisIsWarm, remaining: vallisRemaining },
    cambion: { isFass: cambionIsFass, remaining: cambionRemaining },
  };
}

const DUVIRI_MOODS = {
  joy: '\u{1F60A} Joy',
  anger: '\u{1F621} Anger',
  envy: '\u{1F7E2} Envy',
  sorrow: '\u{1F622} Sorrow',
  fear: '\u{1F630} Fear',
};

export async function build(cycles) {
  if (!cycles) {
    return emptyEmbed('World Cycles', 'Cycle data unavailable.');
  }

  const earth = cycles.earth.isDay ? '\u2600\uFE0F Day' : '\u{1F319} Night';
  const cetus = cycles.cetus.isDay ? '\u2600\uFE0F Day' : '\u{1F319} Night';
  const vallis = cycles.vallis.isWarm ? '\u{1F525} Warm' : '\u2744\uFE0F Cold';
  const cambion = cycles.cambion.isFass ? '\u2600\uFE0F Fass' : '\u{1F319} Vome';

  let desc =
    `**Earth** ${earth} \u2022 ${formatDuration(cycles.earth.remaining)}\n` +
    `**Cetus** ${cetus} \u2022 ${formatDuration(cycles.cetus.remaining)}\n` +
    `**Orb Vallis** ${vallis} \u2022 ${formatDuration(cycles.vallis.remaining)}\n` +
    `**Cambion Drift** ${cambion} \u2022 ${formatDuration(cycles.cambion.remaining)}`;

  // Fetch Zariman and Duviri cycles from warframestat.us
  try {
    const zariman = await fetchCycle('zarimanCycle');
    if (zariman && zariman.state) {
      const state = zariman.isCorpus ? '\u{1F535} Corpus' : '\u{1F534} Grineer';
      const timeLeft = zariman.timeLeft || '';
      desc += `\n**Zariman** ${state}${timeLeft ? ` \u2022 ${timeLeft}` : ''}`;
    }
  } catch { /* optional */ }

  try {
    const duviri = await fetchCycle('duviriCycle');
    if (duviri && duviri.state) {
      const mood = DUVIRI_MOODS[duviri.state] || duviri.state;
      const expiry = duviri.expiry ? new Date(duviri.expiry) : null;
      const remaining = expiry ? formatDuration(Math.max(0, (expiry - Date.now()) / 1000)) : '';
      desc += `\n**Duviri** ${mood}${remaining ? ` \u2022 ${remaining}` : ''}`;
    }
  } catch { /* optional */ }

  return new EmbedBuilder()
    .setAuthor({ name: 'World Cycles' })
    .setDescription(desc)
    .setColor(COLORS.CYCLES);
}
