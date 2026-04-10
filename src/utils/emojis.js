// Centralized emoji system
// USE_CUSTOM_EMOJIS=true → uploads Warframe icons and uses them in embeds
// USE_CUSTOM_EMOJIS=false (default) → original Unicode fallbacks only where they existed before

import { REST, Routes } from 'discord.js';

const CDN_BASE = 'https://cdn.warframestat.us/img';
const WIKI = 'https://wiki.warframe.com/images';

// Custom emojis: name → full URL (only uploaded if enabled)
export const CUSTOM_EMOJI_SOURCES = {
  // Factions
  wf_grineer:      `${WIKI}/Grineer.png`,
  wf_corpus:       `${WIKI}/Corpus.png`,
  wf_infested:     `${WIKI}/Infested.png`,

  // Relics
  wf_lith:         `${CDN_BASE}/lith-intact.png`,
  wf_meso:         `${CDN_BASE}/meso-intact.png`,
  wf_neo:          `${CDN_BASE}/neo-intact.png`,
  wf_axi:          `${CDN_BASE}/axi-intact.png`,
  wf_requiem:      `${CDN_BASE}/requiem-intact.png`,

  // Currencies
  wf_platinum:     `${WIKI}/Platinum.png`,
  wf_credits:      `${WIKI}/Credits.png`,
  wf_ducats:       `${CDN_BASE}/orokin-ducats-a848560234.png`,
  wf_aya:          `${CDN_BASE}/aya-e2d16ae283.png`,
  wf_endo:         `${CDN_BASE}/cetustieraendocommon-1803c5f5e4.png`,
  wf_voidtraces:   `${CDN_BASE}/void-traces-9a7f26f348.png`,
  wf_steelessence: `${CDN_BASE}/steel-essence-678257de49.png`,
  wf_vitus:        `${CDN_BASE}/vitus-essence-c81ca0b866.png`,
  wf_forma:        `${CDN_BASE}/forma-778e068bc2.png`,
  wf_catalyst:     `${CDN_BASE}/orokin-catalyst-0131dd654f.png`,
  wf_reactor:      `${CDN_BASE}/orokin-reactor-2841cfd806.png`,

  // Resources
  wf_orokincell:   `${CDN_BASE}/orokin-cell-0d237af036.png`,
  wf_argon:        `${CDN_BASE}/argon-crystal-f099c16dc9.png`,
  wf_neurodes:     `${CDN_BASE}/neurodes-c027fd4a28.png`,
  wf_nitain:       `${CDN_BASE}/nitain-extract-ba7ea3b2cf.png`,
  wf_oxium:        `${CDN_BASE}/oxium-5f4e4dfeac.png`,
  wf_plastids:     `${CDN_BASE}/plastids-dabf813edd.png`,
  wf_cryotic:      `${CDN_BASE}/cryotic-0c63ca0f8d.png`,
  wf_tellurium:    `${CDN_BASE}/tellurium-9236306b55.png`,
  wf_polymer:      `${CDN_BASE}/polymer-bundle-b8d240c368.png`,
  wf_gallium:      `${CDN_BASE}/gallium-127519dba9.png`,
  wf_morphics:     `${CDN_BASE}/morphics-657362f875.png`,
  wf_salvage:      `${CDN_BASE}/salvage-b2174bedac.png`,
  wf_ferrite:      `${CDN_BASE}/ferrite-cfb542c27b.png`,
  wf_alloyplate:   `${CDN_BASE}/alloy-plate-af5adc4919.png`,
  wf_neuralsensor: `${CDN_BASE}/neural-sensors-c7fa03491a.png`,
  wf_controlmod:   `${CDN_BASE}/control-module-edf6e412c3.png`,
  wf_cetuswisp:    `${CDN_BASE}/cetus-wisp-0681ca5991.png`,
};

// Unicode fallbacks — only for things that had emojis before
const UNICODE = {
  // Factions
  grineer: '\u{1F534}', corpus: '\u{1F535}', infested: '\u{1F7E2}',
  corrupted: '\u{1F7E1}', sentient: '\u{1F7E3}',
  // Relics
  lith: '\u{1F7E4}', meso: '\u{1F535}', neo: '\u{1F534}',
  axi: '\u{1F7E1}', requiem: '\u{1F7E3}', omnia: '\u26AA',
  // Cycles
  day: '\u2600\uFE0F', night: '\u{1F319}', warm: '\u{1F525}', cold: '\u2744\uFE0F',
  // Duviri moods
  sorrow: '\u{1F622}', fear: '\u{1F630}', joy: '\u{1F60A}', anger: '\u{1F621}', envy: '\u{1F7E2}',
  // Calendar
  challenge: '\u{1F4CB}', reward: '\u{1F381}', override: '\u2699\uFE0F', operation: '\u2694\uFE0F',
  // Rarity
  common: '\u{1F7E4}', uncommon: '\u26AA', rare: '\u{1F7E1}',
  // Generic
  unknown: '\u2B1C',
};

let customEmojis = null;
let useCustom = false;

export async function initEmojis() {
  if (process.env.USE_CUSTOM_EMOJIS !== 'true' || !process.env.GUILD_ID || !process.env.DISCORD_TOKEN) {
    console.log('[Emojis] Using Unicode emojis');
    return;
  }

  console.log('[Emojis] Loading custom emojis...');

  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    const guildId = process.env.GUILD_ID;

    // Fetch existing emojis via REST (doesn't hang like guild.emojis.fetch)
    const existing = await rest.get(Routes.guildEmojis(guildId));
    const existingNames = new Set(existing.map(em => em.name));

    // Build lookup from what already exists
    const allEmojis = existing;
    customEmojis = new Map();
    for (const emoji of allEmojis) {
      if (emoji.name.startsWith('wf_')) {
        customEmojis.set(emoji.name, `<:${emoji.name}:${emoji.id}>`);
      }
    }

    useCustom = customEmojis.size > 0;
    console.log(`[Emojis] Loaded ${customEmojis.size} custom emojis`);
  } catch (err) {
    console.warn('[Emojis] Failed to init:', err.message);
  }
}

export function e(key) {
  if (useCustom) {
    const custom = customEmojis.get(`wf_${key}`);
    if (custom) return custom;
  }
  return UNICODE[key] || '';
}

export function factionEmoji(code) {
  const map = { FC_GRINEER: 'grineer', FC_CORPUS: 'corpus', FC_INFESTATION: 'infested', FC_OROKIN: 'corrupted', FC_SENTIENT: 'sentient' };
  return e(map[code] || 'unknown');
}

export function tierEmoji(tier) {
  const map = { VoidT1: 'lith', VoidT2: 'meso', VoidT3: 'neo', VoidT4: 'axi', VoidT5: 'requiem', VoidT6: 'omnia' };
  return e(map[tier] || 'unknown');
}
