import { EmbedBuilder } from 'discord.js';
import { toUnix } from '../utils/embed-helpers.js';
import { cached } from '../services/cache.js';
import * as cache from '../services/cache.js';

export const key = 'news';
export const feed = true; // Posts new messages instead of editing one

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

// Returns only NEW articles that haven't been posted yet
export async function build() {
  let articles;
  try {
    articles = await fetchNews();
  } catch {
    return [];
  }

  if (!articles || articles.length === 0) return [];

  // Filter out placeholder entries
  const valid = articles.filter(a => {
    const date = new Date(a.date);
    return date.getFullYear() > 2000 && a.message;
  });

  // Check which articles we've already posted
  const postedIds = cache.get('news:posted') || [];
  const postedSet = new Set(postedIds);

  const newArticles = valid.filter(a => !postedSet.has(a.id));
  if (newArticles.length === 0) return [];

  // Sort oldest first so they post in chronological order
  newArticles.sort((a, b) => new Date(a.date) - new Date(b.date));

  const embeds = newArticles.map(article => {
    const date = new Date(article.date);
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Warframe News' })
      .setDescription(
        `**[${article.message}](${article.link})**\n` +
        `<t:${toUnix(date)}:R>`
      )
      .setColor(article.update ? 0x00BFFF : article.primeAccess ? 0xD4AF37 : 0x3498DB)
      .setTimestamp(date);

    const img = article.imageLink;
    if (img && !img.includes('placeholder')) {
      embed.setImage(img);
    }

    return { embed, id: article.id };
  });

  // Mark these as posted
  const allPosted = [...postedIds, ...newArticles.map(a => a.id)];
  // Keep last 100 to prevent unbounded growth
  cache.set('news:posted', allPosted.slice(-100), 30 * 24 * 60 * 60 * 1000);

  return embeds;
}
