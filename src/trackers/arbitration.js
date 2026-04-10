import { EmbedBuilder } from 'discord.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../config.js';
import { getNodeDetails } from '../utils/warframe-data.js';
import { emptyEmbed, toUnix, formatDuration } from '../utils/embed-helpers.js';

export const key = 'arbitration';

// Parse planet name from node value like "Xini (Eris)"
function getPlanet(nodeValue) {
  if (!nodeValue) return null;
  const match = nodeValue.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

const PLANET_IMAGE = (planet) =>
  planet ? `https://wiki.warframe.com/images/${encodeURIComponent(planet)}.png` : null;

// Load schedule: Map<unixHour, nodeKey>
let schedule = null;
function loadSchedule() {
  if (schedule) return schedule;
  const path = resolve(DATA_DIR, 'arbitrations.txt');
  if (!existsSync(path)) return null;

  schedule = new Map();
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const [ts, node] = line.split(',');
    if (ts && node) schedule.set(Number(ts), node.trim());
  }
  return schedule;
}

loadSchedule();

export function extract() {
  return null;
}

export function build() {
  const sched = loadSchedule();
  if (!sched) {
    return emptyEmbed('Arbitration', 'Schedule not loaded. Run `npm run update-data`.');
  }

  const now = Math.floor(Date.now() / 1000);
  const currentHour = Math.floor(now / 3600) * 3600;
  const currentNode = sched.get(currentHour);

  if (!currentNode) {
    return emptyEmbed('Arbitration', 'No arbitration data for this hour.');
  }

  const details = getNodeDetails(currentNode);
  const nextHourStart = currentHour + 3600;
  const secondsLeft = nextHourStart - now;
  const planet = getPlanet(details.value);

  // Get next 5 upcoming
  const upcoming = [];
  for (let i = 1; i <= 5; i++) {
    const hour = currentHour + (i * 3600);
    const node = sched.get(hour);
    if (!node) break;
    const d = getNodeDetails(node);
    upcoming.push({ hour, node: d.value || node, enemy: d.enemy, type: d.type });
  }

  let desc = `**Current**\n`;
  desc += `**${details.value || currentNode}**\n`;
  desc += `${details.type || 'Unknown'} \u2022 ${details.enemy || 'Unknown'}\n`;
  desc += `Rotates in ${formatDuration(secondsLeft)} \u2022 <t:${toUnix(nextHourStart * 1000)}:R>`;

  if (upcoming.length > 0) {
    desc += '\n\n**Upcoming**\n';
    desc += upcoming.map(u => {
      return `<t:${toUnix(u.hour * 1000)}:t> \u2022 ${u.node} \u2022 ${u.type}`;
    }).join('\n');
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Arbitration' })
    .setDescription(desc)
    .setColor(0x9B59B6);

  const planetImg = PLANET_IMAGE(planet);
  if (planetImg) embed.setImage(planetImg);

  return embed;
}
