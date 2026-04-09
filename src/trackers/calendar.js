import { EmbedBuilder } from 'discord.js';
import { toUnix, emptyEmbed } from '../utils/embed-helpers.js';
import { cached } from '../services/cache.js';

export const key = 'calendar';

const API_URL = 'https://api.warframestat.us/pc/calendar/';
const TTL = 10 * 60 * 1000;
const DAYS_TO_SHOW = 3;

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
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter to today + next few days with events
  const upcoming = data.days
    .filter(day => {
      if (!day.events || day.events.length === 0) return false;
      const gameDate = new Date(day.date);
      return gameDate >= todayStart;
    })
    .slice(0, DAYS_TO_SHOW);

  if (upcoming.length === 0) {
    return emptyEmbed('1999 Calendar', 'No upcoming events this week.');
  }

  const sections = upcoming.map((day, i) => {
    const gameDate = new Date(day.date);
    const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const label = i === 0 ? `__${dateStr} \u2500 Today__` : `__${dateStr}__`;

    const eventLines = day.events.map(event => {
      const emoji = EVENT_EMOJI[event.type] || '\u2022';

      if (event.challenge) {
        return `${emoji} **${event.challenge.title}**\n\u2003${event.challenge.description}`;
      } else if (event.reward) {
        return `${emoji} **${event.reward}**`;
      } else if (event.upgrade) {
        return `${emoji} **${event.upgrade.title}**\n\u2003${event.upgrade.description}`;
      }
      return null;
    }).filter(Boolean);

    return `${label}\n${eventLines.join('\n')}`;
  });

  let desc = sections.join('\n\n');
  if (expiry) {
    desc += `\n\n**Week resets** <t:${toUnix(expiry)}:R>`;
  }

  return new EmbedBuilder()
    .setAuthor({ name: '1999 Calendar' })
    .setDescription(desc)
    .setColor(0x8B4513);
}
