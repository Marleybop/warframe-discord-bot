#!/usr/bin/env node
// Uploads Warframe-themed emojis to your Discord server
// Run: node scripts/setup-emojis.js
//
// Requires DISCORD_TOKEN and GUILD_ID in .env

import '../src/config.js';
import { REST, Routes } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.error('Set DISCORD_TOKEN and GUILD_ID in .env');
  process.exit(1);
}

const CDN = 'https://cdn.warframestat.us/img';

// Emojis to create: { name: filename on CDN }
const EMOJIS = {
  // Relics
  wf_lith:        'lith-intact.png',
  wf_meso:        'meso-intact.png',
  wf_neo:         'neo-intact.png',
  wf_axi:         'axi-intact.png',
  wf_requiem:     'requiem-intact.png',

  // Resources
  wf_forma:       'forma-778e068bc2.png',
  wf_catalyst:    'orokin-catalyst-0131dd654f.png',
  wf_reactor:     'orokin-reactor-2841cfd806.png',
  wf_ducats:      'orokin-ducats-a848560234.png',
  wf_nitain:      'nitain-extract-ba7ea3b2cf.png',
  wf_argon:       'argon-crystal-f099c16dc9.png',
  wf_neurodes:    'neurodes-c027fd4a28.png',
  wf_oxium:       'oxium-5f4e4dfeac.png',
  wf_plastids:    'plastids-dabf813edd.png',
  wf_cryotic:     'cryotic-0c63ca0f8d.png',
  wf_tellurium:   'tellurium-9236306b55.png',
  wf_nanospores:  'nano-spores-8933019524.png',

  // Currencies / rewards
  wf_voidtraces:  'void-traces-9a7f26f348.png',
  wf_steelessence:'steel-essence-678257de49.png',
  wf_umbraforma:  'umbra-forma-1b1719c64c.png',
};

const rest = new REST().setToken(TOKEN);

// Fetch existing emojis to avoid duplicates
async function getExistingEmojis() {
  const emojis = await rest.get(Routes.guildEmojis(GUILD_ID));
  return new Set(emojis.map(e => e.name));
}

async function downloadImage(filename) {
  const res = await fetch(`${CDN}/${filename}`);
  if (!res.ok) throw new Error(`Failed to download ${filename}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function main() {
  const existing = await getExistingEmojis();
  console.log(`Found ${existing.size} existing emojis in server\n`);

  let created = 0;
  let skipped = 0;

  for (const [name, filename] of Object.entries(EMOJIS)) {
    if (existing.has(name)) {
      console.log(`  ${name} — already exists, skipping`);
      skipped++;
      continue;
    }

    try {
      const imageData = await downloadImage(filename);
      await rest.post(Routes.guildEmojis(GUILD_ID), {
        body: { name, image: imageData },
      });
      console.log(`  ${name} — uploaded`);
      created++;
    } catch (err) {
      console.error(`  ${name} — FAILED: ${err.message}`);
    }

    // Respect rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! Created ${created}, skipped ${skipped}`);
}

main();
