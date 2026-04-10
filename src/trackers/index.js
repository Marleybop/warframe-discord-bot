// Registry of all worldstate trackers
// Each tracker exports: { key, extract(ws), build(data) }
// To add a new tracker, create a file and import it here.

import * as fissures from './fissures.js';
import * as baro from './baro.js';
import * as sortie from './sortie.js';
import * as archon from './archon.js';
import * as invasions from './invasions.js';
import * as storms from './storms.js';
import * as cycles from './cycles.js';
import * as darvo from './darvo.js';
import * as nightwave from './nightwave.js';
import * as circuit from './circuit.js';
import * as alerts from './alerts.js';
import * as boosters from './boosters.js';
import * as events from './events.js';
import * as varzia from './varzia.js';
import * as archimedea from './archimedea.js';
import * as fomorian from './fomorian.js';
import * as steelpath from './steelpath.js';
import * as news from './news.js';
import * as calendar from './calendar.js';
import * as arbitration from './arbitration.js';

export const trackers = [
  fissures, baro, sortie, archon, invasions, storms,
  cycles, darvo, nightwave, circuit, alerts, boosters, events,
  varzia, archimedea, fomorian, steelpath, news, calendar, arbitration,
];
