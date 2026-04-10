import { EmbedBuilder } from 'discord.js';
import { toUnix, emptyEmbed } from '../utils/embed-helpers.js';
import { e } from '../utils/emojis.js';
import { cached } from '../services/cache.js';

export const key = 'steelpath';

const API_URL = 'https://api.warframestat.us/pc/steelPath/';
const TTL = 10 * 60 * 1000; // 10 minutes

async function fetchSteelPath() {
  return cached('tracker:steelpath', TTL, async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`steelPath ${res.status}`);
    return res.json();
  });
}

export function extract() {
  return null; // Data comes from warframestat.us, not DE worldstate
}

export async function build() {
  let data;
  try {
    data = await fetchSteelPath();
  } catch {
    return emptyEmbed('Steel Path', 'Could not fetch Steel Path data.');
  }

  const current = data.currentReward;
  const expiry = data.expiry ? new Date(data.expiry) : null;

  let desc = '';
  if (current) {
    desc += `**This Week:** ${current.name} \u2022 ${current.cost} ${e('steelessence')}SE\n`;
  }
  if (expiry) {
    desc += `Rotates <t:${toUnix(expiry)}:R>\n`;
  }

  // Show full rotation
  if (data.rotation?.length > 0) {
    desc += '\n__Rotation__\n';
    desc += data.rotation.map((r, i) => {
      const marker = r.name === current?.name ? '**\u25B6** ' : '\u2003';
      return `${marker}${r.name} \u2022 ${r.cost} ${e('steelessence')}SE`;
    }).join('\n');
  }

  return new EmbedBuilder()
    .setAuthor({ name: 'Steel Path \u2500 Teshin\'s Offerings' })
    .setDescription(desc)
    .setColor(0xC0C0C0);
}
