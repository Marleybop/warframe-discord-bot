import { EmbedBuilder } from 'discord.js';
import { parseDate } from '../services/warframe-api.js';
import { getMissionType, getFaction } from '../utils/warframe-data.js';
import { toUnix, emptyEmbed } from '../utils/embed-helpers.js';

export const key = 'archimedea';

const DEVIATION_NAMES = {
  // Common deviation codes from the worldstate
  CD_NORMAL: 'Normal',
  CD_HARD: 'Hard',
};

function cleanName(code) {
  if (!code) return '';
  // Convert camelCase/PascalCase codes to readable names
  return code
    .replace(/([A-Z])/g, ' $1')
    .replace(/^[\s_]+/, '')
    .trim();
}

export function extract(ws) {
  const conquests = ws.Conquests || [];
  if (conquests.length === 0) return null;

  return conquests.map(c => ({
    type: c.Type,
    activation: parseDate(c.Activation),
    expiry: parseDate(c.Expiry),
    missions: (c.Missions || []).map(m => ({
      faction: m.faction,
      missionType: m.missionType,
      difficulties: (m.difficulties || []).map(d => ({
        type: d.type,
        deviation: d.deviation,
        risks: d.risks || [],
      })),
    })),
    variables: c.Variables || [],
  }));
}

export function build(conquests) {
  if (!conquests || conquests.length === 0) {
    return [emptyEmbed('Deep Archimedea', 'No active Deep Archimedea.')];
  }

  return conquests.map((conquest, idx) => {
    const label = conquest.type === 'CT_LAB' ? 'Lab' : 'Hex';

    const missionLines = conquest.missions.map((m, i) => {
      const mission = getMissionType(m.missionType);
      const faction = getFaction(m.faction);

      const diffLines = m.difficulties.map(d => {
        const difficulty = DEVIATION_NAMES[d.type] || cleanName(d.type);
        const deviation = cleanName(d.deviation);
        const risks = d.risks.map(r => cleanName(r)).filter(Boolean);
        let line = `${difficulty}`;
        if (deviation) line += ` \u2022 ${deviation}`;
        if (risks.length > 0) line += `\n\u2003\u2003Risks: ${risks.join(', ')}`;
        return `\u2003${line}`;
      });

      return `**${i + 1}.** ${faction.emoji} ${mission}\n${diffLines.join('\n')}`;
    });

    let desc = missionLines.join('\n\n');

    if (conquest.variables.length > 0) {
      const vars = conquest.variables.map(v => cleanName(v)).join(', ');
      desc = `**Modifiers:** ${vars}\n\n${desc}`;
    }

    desc += `\n\n**Resets** <t:${toUnix(conquest.expiry)}:R>`;

    return new EmbedBuilder()
      .setAuthor({ name: `Deep Archimedea \u2500 ${label}` })
      .setDescription(desc)
      .setColor(0xCC3333);
  });
}
