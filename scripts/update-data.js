#!/usr/bin/env node
// Downloads the latest WFCD community data files
// Run: node scripts/update-data.js

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'data');

const FILES = [
  {
    url: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/solNodes.json',
    path: 'solNodes.json',
    desc: 'Node names (452 nodes)',
  },
  {
    url: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/languages.json',
    path: 'languages.json',
    desc: 'Item/challenge names (6400+ entries)',
  },
  {
    url: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/sortieData.json',
    path: 'sortieData.json',
    desc: 'Sortie bosses & modifiers',
  },
];

// WFCD item categories to download for image lookups
const ITEM_CATEGORIES = [
  'Mods', 'Weapons', 'Warframes', 'Sentinels', 'Pets',
  'Archwing', 'Melee', 'Primary', 'Secondary', 'Misc',
  'Resources', 'Skins', 'Arcanes', 'Relics',
];

mkdirSync(dataDir, { recursive: true });

console.log('Updating WFCD data files...\n');

for (const file of FILES) {
  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.text();
    writeFileSync(resolve(dataDir, file.path), data);
    const kb = Math.round(data.length / 1024);
    console.log(`  ${file.path} (${kb}KB) - ${file.desc}`);
  } catch (err) {
    console.error(`  ${file.path} FAILED: ${err.message}`);
  }
}

// Build item image lookup and vaulted items list from WFCD warframe-items data
console.log('\nBuilding item image lookup + vaulted list...');
const imageMap = {};
const vaultedItems = {};
for (const category of ITEM_CATEGORIES) {
  const url = `https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/${category}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`  ${category} FAILED: HTTP ${res.status}`); continue; }
    const items = await res.json();
    let imgCount = 0;
    for (const item of items) {
      if (item.uniqueName && item.imageName) {
        imageMap[item.uniqueName.toLowerCase()] = {
          img: item.imageName,
          wiki: item.wikiaThumbnail || null,
        };
        imgCount++;
      }
      // Collect vaulted Prime items (skip components/parts, keep main items)
      if (item.name?.includes('Prime') && item.vaulted === true) {
        const cat = item.category || category;
        if (!vaultedItems[cat]) vaultedItems[cat] = [];
        vaultedItems[cat].push(item.name);
      }
    }
    console.log(`  ${category}: ${imgCount} images`);
  } catch (err) {
    console.error(`  ${category} FAILED: ${err.message}`);
  }
}

const imageJson = JSON.stringify(imageMap);
writeFileSync(resolve(dataDir, 'itemImages.json'), imageJson);
const imgKb = Math.round(imageJson.length / 1024);
console.log(`  itemImages.json (${imgKb}KB) - ${Object.keys(imageMap).length} item images`);

const vaultedJson = JSON.stringify(vaultedItems, null, 2);
writeFileSync(resolve(dataDir, 'vaulted.json'), vaultedJson);
const vaultKb = Math.round(vaultedJson.length / 1024);
const vaultCount = Object.values(vaultedItems).reduce((sum, arr) => sum + arr.length, 0);
console.log(`  vaulted.json (${vaultKb}KB) - ${vaultCount} vaulted items`);

console.log('\nDone! Data files are up to date.');
