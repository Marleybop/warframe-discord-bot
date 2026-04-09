import { EmbedBuilder } from 'discord.js';

// Convert a Date (or ms timestamp) to Discord's unix format
export function toUnix(date) {
  return Math.floor(date / 1000);
}

// Format seconds into a human-readable duration
export function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

// Build a text progress bar
export function progressBar(ratio, length = 10) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filled = Math.round(clamped * length);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(length - filled);
}

// Create a "no data" placeholder embed
export function emptyEmbed(title, message = 'No data available.') {
  return new EmbedBuilder()
    .setAuthor({ name: title })
    .setDescription(message)
    .setColor(0x2B2D31);
}

// Shared color constants
export const COLORS = {
  // Fissure tiers
  LITH:    0xA68B5B,
  MESO:    0x3A86FF,
  NEO:     0xC1121F,
  AXI:     0xFFB703,
  REQUIEM: 0x7B2D8B,
  OMNIA:   0xBBBBBB,

  // Tracker-specific
  BARO_WAITING: 0xDAA520,
  BARO_ACTIVE:  0xFFD700,
  BARO_GONE:    0x808080,
  SORTIE:       0xE74C3C,
  ARCHON:       0x9B59B6,
  INVASION:     0xE67E22,
  STORMS:       0x3498DB,
  CYCLES:       0x2ECC71,
  DARVO_ACTIVE: 0x1ABC9C,
  DARVO_SOLD:   0x808080,
  NIGHTWAVE:    0x8E44AD,
  CIRCUIT:      0xF39C12,
  ALERTS:       0xF1C40F,
  BOOSTERS:     0x00FF88,

  // Event types
  EVENT_ANNIVERSARY: 0xF1C40F,
  EVENT_OPERATION:   0xFF6B6B,
  EVENT_DEFAULT:     0x3498DB,

  // Generic
  INACTIVE: 0x2B2D31,
};

export const TIER_COLORS = {
  VoidT1: COLORS.LITH,
  VoidT2: COLORS.MESO,
  VoidT3: COLORS.NEO,
  VoidT4: COLORS.AXI,
  VoidT5: COLORS.REQUIEM,
  VoidT6: COLORS.OMNIA,
};
