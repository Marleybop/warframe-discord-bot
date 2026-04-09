import { EmbedBuilder } from 'discord.js';
import { emptyEmbed, formatDuration, COLORS } from '../utils/embed-helpers.js';

export const key = 'cycles';

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

export function build(cycles) {
  if (!cycles) {
    return emptyEmbed('World Cycles', 'Cycle data unavailable.');
  }

  const earth = cycles.earth.isDay ? '\u2600\uFE0F Day' : '\u{1F319} Night';
  const cetus = cycles.cetus.isDay ? '\u2600\uFE0F Day' : '\u{1F319} Night';
  const vallis = cycles.vallis.isWarm ? '\u{1F525} Warm' : '\u2744\uFE0F Cold';
  const cambion = cycles.cambion.isFass ? '\u2600\uFE0F Fass' : '\u{1F319} Vome';

  return new EmbedBuilder()
    .setAuthor({ name: 'World Cycles' })
    .setDescription(
      `**Earth** ${earth} \u2022 ${formatDuration(cycles.earth.remaining)}\n` +
      `**Cetus** ${cetus} \u2022 ${formatDuration(cycles.cetus.remaining)}\n` +
      `**Orb Vallis** ${vallis} \u2022 ${formatDuration(cycles.vallis.remaining)}\n` +
      `**Cambion Drift** ${cambion} \u2022 ${formatDuration(cycles.cambion.remaining)}`
    )
    .setColor(COLORS.CYCLES);
}
