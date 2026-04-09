import { EmbedBuilder } from 'discord.js';
import { toUnix, emptyEmbed } from '../utils/embed-helpers.js';
import { cached } from '../services/cache.js';

export const key = 'calendar';

const API_URL = 'https://api.warframestat.us/pc/calendar/';
const TTL = 10 * 60 * 1000;

async function fetchCalendar() {
  return cached('tracker:calendar', TTL, async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`calendar ${res.status}`);
    return res.json();
  });
}

export function extract() {
  return null;
}

const EVENT_EMOJI = {
  'To Do': '\u{1F4CB}',
  'Big Prize!': '\u{1F381}',
  'Override': '\u2699\uFE0F',
  'Operation': '\u2694\uFE0F',
};

export async function build() {
  let data;
  try {
    data = await fetchCalendar();
  } catch {
    return emptyEmbed('1999 Calendar', 'Could not fetch calendar data.');
  }

  if (!data?.days?.length) {
    return emptyEmbed('1999 Calendar', 'No calendar data available.');
  }

  const expiry = data.expiry ? new Date(data.expiry) : null;

  const lines = [];
  for (const day of data.days) {
    if (!day.events || day.events.length === 0) continue;

    // Format the in-game date
    const gameDate = new Date(day.date);
    const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    for (const event of day.events) {
      const emoji = EVENT_EMOJI[event.type] || '\u2022';

      if (event.challenge) {
        lines.push(`${emoji} **${dateStr}** \u2500 ${event.challenge.title}\n\u2003${event.challenge.description}`);
      } else if (event.reward) {
        lines.push(`${emoji} **${dateStr}** \u2500 ${event.reward}`);
      } else if (event.upgrade) {
        lines.push(`${emoji} **${dateStr}** \u2500 ${event.upgrade.title}\n\u2003${event.upgrade.description}`);
      }
    }
  }

  if (lines.length === 0) {
    return emptyEmbed('1999 Calendar', 'No upcoming events.');
  }

  let desc = lines.join('\n');
  if (expiry) {
    desc += `\n\n**Resets** <t:${toUnix(expiry)}:R>`;
  }

  // Split into multiple embeds if too long
  if (desc.length > 4000) {
    const mid = desc.lastIndexOf('\n', 2000);
    const first = desc.slice(0, mid);
    const second = desc.slice(mid + 1);

    return [
      new EmbedBuilder()
        .setAuthor({ name: '1999 Calendar' })
        .setDescription(first)
        .setColor(0x8B4513),
      new EmbedBuilder()
        .setDescription(second)
        .setColor(0x8B4513),
    ];
  }

  return new EmbedBuilder()
    .setAuthor({ name: '1999 Calendar' })
    .setDescription(desc)
    .setColor(0x8B4513);
}
