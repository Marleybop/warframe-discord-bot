import { EmbedBuilder } from 'discord.js';
import { toUnix, emptyEmbed } from '../utils/embed-helpers.js';
import { cached } from '../services/cache.js';

export const key = 'news';

const API_URL = 'https://api.warframestat.us/pc/news/';
const TTL = 10 * 60 * 1000;

async function fetchNews() {
  return cached('tracker:news', TTL, async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`news ${res.status}`);
    return res.json();
  });
}

export function extract() {
  return null;
}

export async function build() {
  let articles;
  try {
    articles = await fetchNews();
  } catch {
    return [emptyEmbed('Warframe News', 'Could not fetch news.')];
  }

  if (!articles || articles.length === 0) {
    return [emptyEmbed('Warframe News', 'No news available.')];
  }

  // Filter out placeholder/permanent entries, sort by date descending
  const recent = articles
    .filter(a => {
      const date = new Date(a.date);
      return date.getFullYear() > 2000 && a.message;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recent.length === 0) {
    return [emptyEmbed('Warframe News', 'No recent news.')];
  }

  const embeds = recent.map((article, i) => {
    const date = new Date(article.date);
    const embed = new EmbedBuilder()
      .setDescription(
        `**[${article.message}](${article.link})**\n` +
        `<t:${toUnix(date)}:R>`
      )
      .setColor(article.update ? 0x00BFFF : article.primeAccess ? 0xD4AF37 : 0x3498DB);

    if (i === 0) embed.setAuthor({ name: 'Warframe News' });

    // Show banner image on the first article
    const img = article.imageLink;
    if (img && i === 0 && !img.includes('placeholder')) {
      embed.setImage(img);
    }

    return embed;
  });

  return embeds;
}
