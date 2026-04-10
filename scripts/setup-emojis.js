#!/usr/bin/env node
// Uploads missing Warframe emojis to your Discord server
// Run: npm run setup-emojis

import '../src/config.js';
import sharp from 'sharp';
import { CUSTOM_EMOJI_SOURCES } from '../src/utils/emojis.js';

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.error('Set DISCORD_TOKEN and GUILD_ID in .env');
  process.exit(1);
}

const API = `https://discord.com/api/v10/guilds/${GUILD_ID}/emojis`;

// Fetch existing emojis
const existingRes = await fetch(API, {
  headers: { Authorization: `Bot ${TOKEN}` },
});
const existing = await existingRes.json();
const existingNames = new Set(existing.map(e => e.name));

const missing = Object.entries(CUSTOM_EMOJI_SOURCES).filter(([name]) => !existingNames.has(name));

if (missing.length === 0) {
  console.log('All emojis already uploaded!');
  process.exit(0);
}

console.log(`Uploading ${missing.length} emojis...\n`);

for (const [name, url] of missing) {
  try {
    console.log(`  ${name}: downloading...`);
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`  ${name}: FAILED (HTTP ${res.status})`); continue; }
    const raw = Buffer.from(await res.arrayBuffer());
    const buf = await sharp(raw).resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

    console.log(`  ${name}: uploading (${Math.round(buf.length / 1024)}KB)...`);
    const uploadRes = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        image: `data:image/png;base64,${buf.toString('base64')}`,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (uploadRes.ok) {
      console.log(`  ${name}: done`);
    } else if (uploadRes.status === 429) {
      const err = await uploadRes.json().catch(() => ({}));
      const retryAfter = (err.retry_after || 30) * 1000;
      console.log(`  ${name}: rate limited, waiting ${Math.round(retryAfter / 1000)}s...`);
      await new Promise(r => setTimeout(r, retryAfter));
      // Retry once
      const retry = await fetch(API, {
        method: 'POST',
        headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: `data:image/png;base64,${buf.toString('base64')}` }),
        signal: AbortSignal.timeout(15000),
      });
      if (retry.ok) console.log(`  ${name}: done (retry)`);
      else console.log(`  ${name}: FAILED on retry`);
    } else {
      const err = await uploadRes.json().catch(() => ({}));
      console.log(`  ${name}: FAILED (${uploadRes.status} ${err.message || ''})`);
    }

    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.log(`  ${name}: FAILED (${err.message})`);
  }
}

console.log('\nDone!');
process.exit(0);
