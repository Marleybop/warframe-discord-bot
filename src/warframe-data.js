import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'data');

// Load WFCD community data files
const solNodes = JSON.parse(readFileSync(resolve(dataDir, 'solNodes.json'), 'utf8'));
const languages = JSON.parse(readFileSync(resolve(dataDir, 'languages.json'), 'utf8'));
const sortieData = JSON.parse(readFileSync(resolve(dataDir, 'sortieData.json'), 'utf8'));

// Build a case-insensitive item lookup from the languages file
const itemLookup = new Map();
for (const [key, val] of Object.entries(languages)) {
  itemLookup.set(key.toLowerCase(), val.value || val);
}

export const VOID_TIERS = {
  VoidT1: { name: 'Lith', emoji: '🟤' },
  VoidT2: { name: 'Meso', emoji: '🔵' },
  VoidT3: { name: 'Neo', emoji: '🔴' },
  VoidT4: { name: 'Axi', emoji: '🟡' },
  VoidT5: { name: 'Requiem', emoji: '🟣' },
  VoidT6: { name: 'Omnia', emoji: '⚪' },
};

export const FACTIONS = {
  FC_GRINEER: { name: 'Grineer', emoji: '🔴' },
  FC_CORPUS: { name: 'Corpus', emoji: '🔵' },
  FC_INFESTATION: { name: 'Infested', emoji: '🟢' },
  FC_OROKIN: { name: 'Corrupted', emoji: '🟡' },
  FC_SENTIENT: { name: 'Sentient', emoji: '🟣' },
};

export function getNodeName(code) {
  const node = solNodes[code];
  if (node) return node.value;
  return code;
}

export function getNodeDetails(code) {
  return solNodes[code] || { value: code, enemy: 'Unknown', type: 'Unknown' };
}

export function getMissionType(code) {
  // Check sortie data for proper names
  const missionMap = {
    MT_EXTERMINATION: 'Exterminate',
    MT_SURVIVAL: 'Survival',
    MT_DEFENSE: 'Defense',
    MT_MOBILE_DEFENSE: 'Mobile Defense',
    MT_RESCUE: 'Rescue',
    MT_SABOTAGE: 'Sabotage',
    MT_CAPTURE: 'Capture',
    MT_ASSASSINATION: 'Assassination',
    MT_SPY: 'Spy',
    MT_INTERCEPTION: 'Interception',
    MT_ARTIFACT: 'Disruption',
    MT_TERRITORY: 'Interception',
    MT_CORRUPTION: 'Void Flood',
    MT_ALCHEMY: 'Alchemy',
    MT_VOID_CASCADE: 'Void Cascade',
    MT_EXCAVATION: 'Excavation',
    MT_HIVE: 'Hive',
    MT_INTEL: 'Spy',
    MT_ASSAULT: 'Assault',
    MT_RAILJACK: 'Railjack',
    MT_SKIRMISH: 'Skirmish',
    MT_VOLATILE: 'Volatile',
    MT_ORPHIX: 'Orphix',
  };
  return missionMap[code] || code.replace('MT_', '').replace(/_/g, ' ');
}

export function getTier(modifier) {
  return VOID_TIERS[modifier] || { name: modifier, emoji: '⬜' };
}

export function getRegion(id) {
  const regions = {
    0: 'Earth', 1: 'Venus', 2: 'Mercury', 3: 'Mars',
    4: 'Phobos', 5: 'Void', 6: 'Jupiter', 7: 'Saturn',
    8: 'Uranus', 9: 'Neptune', 10: 'Pluto', 11: 'Sedna',
    12: 'Ceres', 13: 'Eris', 14: 'Europa', 15: 'Lua',
    16: 'Deimos', 17: 'Kuva Fortress', 18: 'Zariman',
    19: 'Void', 20: 'Veil Proxima', 21: 'Earth Proxima',
    22: 'Duviri',
  };
  return regions[id] || `Region ${id}`;
}

export function getBoss(code) {
  const boss = sortieData.bosses?.[code];
  if (boss) return boss.name;
  return code.replace('SORTIE_BOSS_', '').replace(/_/g, ' ');
}

export function getModifier(code) {
  return sortieData.modifierTypes?.[code] || code.replace('SORTIE_MODIFIER_', '').replace(/_/g, ' ');
}

export function getFaction(code) {
  return FACTIONS[code] || { name: code.replace('FC_', ''), emoji: '⬜' };
}

export function getChallengeName(path) {
  if (!path) return { title: 'Unknown', desc: '' };
  const lower = path.toLowerCase();
  if (itemLookup.has(lower)) {
    const val = languages[Object.keys(languages).find(k => k.toLowerCase() === lower)];
    if (val && typeof val === 'object') return { title: val.value || 'Unknown', desc: val.desc || '' };
    return { title: String(val), desc: '' };
  }
  // Fallback: clean path name
  const raw = path.split('/').pop()
    .replace(/^Season(Daily|Weekly|Elite)?/, '')
    .replace(/^Permanent/, '')
    .replace(/(\d+)$/, ' $1')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
  return { title: raw, desc: '' };
}

export function getItemName(path) {
  if (!path) return 'Unknown';

  // Try exact match (case-insensitive)
  const lower = path.toLowerCase();
  if (itemLookup.has(lower)) return itemLookup.get(lower);

  // Try with /lotus/storeitems/ prefix swap
  const storeVariant = lower.replace('/lotus/types/', '/lotus/storeitems/types/');
  if (itemLookup.has(storeVariant)) return itemLookup.get(storeVariant);

  // Try without /lotus/types/ prefix, just the storeitems version
  const noPrefix = '/lotus/storeitems/' + lower.split('/lotus/')[1];
  if (itemLookup.has(noPrefix)) return itemLookup.get(noPrefix);

  // Fallback: clean up the path name
  return path.split('/').pop().replace(/([A-Z])/g, ' $1').trim();
}
