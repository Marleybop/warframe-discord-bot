import { EmbedBuilder } from 'discord.js';
import { toUnix, emptyEmbed } from '../utils/embed-helpers.js';
import { cached } from '../services/cache.js';
import { e } from '../utils/emojis.js';

export const key = 'calendar';

const API_URL = 'https://api.warframestat.us/pc/calendar/';
const TTL = 10 * 60 * 1000;
const DAYS_TO_SHOW = 14;

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
  'To Do': () => e('challenge'),
  'Big Prize!': () => e('reward'),
  'Override': () => e('override'),
  'Operation': () => e('operation'),
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
  const activation = data.activation ? new Date(data.activation) : null;

  // Calendar uses in-game 1999 dates — map them to real-world dates
  // The activation date is when this week's rotation started
  const daysWithDates = data.days.map((day, i) => {
    const gameDate = new Date(day.date);
    // Calculate real-world date: activation + day offset from first day
    const firstGameDate = new Date(data.days[0]?.date || day.date);
    const dayOffset = Math.round((gameDate - firstGameDate) / (24 * 60 * 60 * 1000));
    const realDate = activation ? new Date(activation.getTime() + dayOffset * 24 * 60 * 60 * 1000) : gameDate;
    return { ...day, realDate };
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter to today + next N days with events
  const upcoming = daysWithDates
    .filter(day => {
      if (!day.events || day.events.length === 0) return false;
      return day.realDate >= todayStart;
    })
    .slice(0, DAYS_TO_SHOW);

  if (upcoming.length === 0) {
    return emptyEmbed('1999 Calendar', 'No upcoming events this week.');
  }

  const sections = upcoming.map((day, i) => {
    const dateStr = day.realDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const isToday = day.realDate.toDateString() === now.toDateString();
    const label = isToday ? `__${dateStr} \u2500 Today__` : `__${dateStr}__`;

    const eventLines = day.events.map(event => {
      const emojiGetter = EVENT_EMOJI[event.type];
      const emoji = emojiGetter ? emojiGetter() : '\u2022';

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

  // Split into multiple embeds if needed (4000 char limit per embed)
  const embeds = [];
  let current = [];
  let currentLen = 0;

  for (const section of sections) {
    if (currentLen + section.length + 2 > 3800 && current.length > 0) {
      embeds.push(current.join('\n\n'));
      current = [];
      currentLen = 0;
    }
    current.push(section);
    currentLen += section.length + 2;
  }
  if (current.length > 0) {
    let last = current.join('\n\n');
    if (expiry) last += `\n\n**Week resets** <t:${toUnix(expiry)}:R>`;
    embeds.push(last);
  }

  return embeds.map((desc, i) => {
    const embed = new EmbedBuilder()
      .setDescription(desc)
      .setColor(0x8B4513);
    if (i === 0) embed.setAuthor({ name: '1999 Calendar' });
    return embed;
  });
}
