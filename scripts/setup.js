#!/usr/bin/env node
// Quick setup script — works on Windows, macOS, and Linux
// Run: node scripts/setup.js

import { existsSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envFile = resolve(root, '.env');
const envExample = resolve(root, '.env.example');

console.log('Warframe Tracker - Setup\n');

// Step 1: Create .env if missing
if (!existsSync(envFile)) {
  copyFileSync(envExample, envFile);
  console.log('  Created .env from .env.example');
  console.log('  >> Edit .env and add your DISCORD_TOKEN and channel IDs\n');
} else {
  console.log('  .env already exists\n');
}

// Step 2: Install dependencies
console.log('  Installing dependencies...');
try {
  execSync('npm install', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('  npm install failed. Make sure Node.js 18+ is installed.');
  process.exit(1);
}

// Step 3: Download/update WFCD data
console.log('\n  Downloading game data...');
try {
  execSync('node scripts/update-data.js', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('  Data download failed, but existing data files may still work.');
}

console.log(`
Setup complete!

Next steps:
  1. Edit .env and add your DISCORD_TOKEN
  2. Add channel IDs for the trackers you want
  3. Run: npm start

Need a bot token? https://discord.com/developers/applications
  > New Application > Bot > Reset Token > Copy
`);
