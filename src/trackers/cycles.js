import { EmbedBuilder } from 'discord.js';
import { emptyEmbed, formatDuration, COLORS } from '../utils/embed-helpers.js';
import { e } from '../utils/emojis.js';

export const key = 'cycles';

// Duviri mood rotation: 7200s (2h) per mood, 5 moods = 36000s full cycle
const DUVIRI_MOODS = ['Sorrow', 'Fear', 'Joy', 'Anger', 'Envy'];
const DUVIRI_MOOD_LENGTH = 7200;
const DUVIRI_FULL_CYCLE = DUVIRI_MOOD_LENGTH * 5;

// Zariman: 9000s (2.5h) cycle, offset 4380, first half = corpus
const ZARIMAN_CYCLE = 9000;
const ZARIMAN_OFFSET = 4380;
const ZARIMAN_HALF = 4500;

export function extract(ws) {
  const time = ws.Time;

  // Earth: 28800s cycle (8h), first half = day
  const earthSec = time % 28800;
  const earthIsDay = earthSec < 14400;
  const earthRemaining = earthIsDay ? 14400 - earthSec : 28800 - earthSec;

  // Cetus: 8998s cycle (~2.5h), first 6000s = day
  const cetusSec = (time + 3000) % 8998;
  const cetusIsDay = cetusSec < 6000;
  const cetusRemaining = cetusIsDay ? 6000 - cetusSec : 8998 - cetusSec;

  // Orb Vallis: 1600s cycle (20min), first 400s = warm
  const vallisSec = time % 1600;
  const vallisIsWarm = vallisSec < 400;
  const vallisRemaining = vallisIsWarm ? 400 - vallisSec : 1600 - vallisSec;

  // Cambion Drift: 1800s cycle (30min), first 900s = fass
  const cambionSec = time % 1800;
  const cambionIsFass = cambionSec < 900;
  const cambionRemaining = cambionIsFass ? 900 - cambionSec : 1800 - cambionSec;

  // Zariman: 9000s cycle, offset 4380, first 4500s = corpus
  const zarSec = (time + ZARIMAN_OFFSET) % ZARIMAN_CYCLE;
  const zarIsCorpus = zarSec < ZARIMAN_HALF;
  const zarRemaining = zarIsCorpus ? ZARIMAN_HALF - zarSec : ZARIMAN_CYCLE - zarSec;

  // Duviri: 7200s per mood, 5 moods, no offset needed (aligns with epoch)
  const duvSec = time % DUVIRI_FULL_CYCLE;
  const duvMoodIdx = Math.floor(duvSec / DUVIRI_MOOD_LENGTH);
  const duvRemaining = DUVIRI_MOOD_LENGTH - (duvSec % DUVIRI_MOOD_LENGTH);

  return {
    earth: { isDay: earthIsDay, remaining: earthRemaining },
    cetus: { isDay: cetusIsDay, remaining: cetusRemaining },
    vallis: { isWarm: vallisIsWarm, remaining: vallisRemaining },
    cambion: { isFass: cambionIsFass, remaining: cambionRemaining },
    zariman: { isCorpus: zarIsCorpus, remaining: zarRemaining },
    duviri: { mood: DUVIRI_MOODS[duvMoodIdx], remaining: duvRemaining },
  };
}

export function build(cycles) {
  if (!cycles) {
    return emptyEmbed('World Cycles', 'Cycle data unavailable.');
  }

  const earth = cycles.earth.isDay ? `${e('day')} Day` : `${e('night')} Night`;
  const cetus = cycles.cetus.isDay ? `${e('day')} Day` : `${e('night')} Night`;
  const vallis = cycles.vallis.isWarm ? `${e('warm')} Warm` : `${e('cold')} Cold`;
  const cambion = cycles.cambion.isFass ? `${e('day')} Fass` : `${e('night')} Vome`;
  const zariman = cycles.zariman.isCorpus ? `${e('corpus')} Corpus` : `${e('grineer')} Grineer`;
  const mood = cycles.duviri.mood.toLowerCase();
  const duviri = `${e(mood)} ${cycles.duviri.mood}`;

  return new EmbedBuilder()
    .setAuthor({ name: 'World Cycles' })
    .setDescription(
      `**Earth** ${earth} \u2022 ${formatDuration(cycles.earth.remaining)}\n` +
      `**Cetus** ${cetus} \u2022 ${formatDuration(cycles.cetus.remaining)}\n` +
      `**Orb Vallis** ${vallis} \u2022 ${formatDuration(cycles.vallis.remaining)}\n` +
      `**Cambion Drift** ${cambion} \u2022 ${formatDuration(cycles.cambion.remaining)}\n` +
      `**Zariman** ${zariman} \u2022 ${formatDuration(cycles.zariman.remaining)}\n` +
      `**Duviri** ${duviri} \u2022 ${formatDuration(cycles.duviri.remaining)}`
    )
    .setColor(COLORS.CYCLES);
}
