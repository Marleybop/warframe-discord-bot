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

console.log('\nDone! Data files are up to date.');
