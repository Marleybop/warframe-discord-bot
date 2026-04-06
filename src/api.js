// Fetches live worldstate from Digital Extremes' official endpoint

const DE_URL = 'https://content.warframe.com/dynamic/worldState.php';

export async function fetchWorldState() {
  try {
    const res = await fetch(DE_URL);
    if (!res.ok) throw new Error(`DE API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[API] Failed to fetch worldstate:', err.message);
    return null;
  }
}

// Parse DE's timestamp format: { "$date": { "$numberLong": "1234567890000" } }
export function parseDate(dateObj) {
  if (!dateObj) return null;
  if (dateObj.$date) return new Date(Number(dateObj.$date.$numberLong));
  return new Date(dateObj);
}

export function extractFissures(ws) {
  return (ws.ActiveMissions || []).map(m => ({
    node: m.Node,
    missionType: m.MissionType,
    tier: m.Modifier,
    region: m.Region,
    activation: parseDate(m.Activation),
    expiry: parseDate(m.Expiry),
  }));
}

export function extractVoidTrader(ws) {
  const traders = ws.VoidTraders || [];
  if (traders.length === 0) return null;
  const t = traders[0];
  return {
    character: t.Character,
    node: t.Node,
    activation: parseDate(t.Activation),
    expiry: parseDate(t.Expiry),
    inventory: t.Manifest || [],
  };
}

export function extractSortie(ws) {
  const s = ws.Sorties?.[0];
  if (!s) return null;
  return {
    boss: s.Boss,
    activation: parseDate(s.Activation),
    expiry: parseDate(s.Expiry),
    variants: (s.Variants || []).map(v => ({
      missionType: v.missionType,
      modifier: v.modifierType,
      node: v.node,
    })),
  };
}

export function extractArchonHunt(ws) {
  const s = ws.LiteSorties?.[0];
  if (!s) return null;
  return {
    boss: s.Boss,
    activation: parseDate(s.Activation),
    expiry: parseDate(s.Expiry),
    missions: (s.Missions || []).map(m => ({
      missionType: m.missionType,
      node: m.node,
    })),
  };
}

export function extractInvasions(ws) {
  return (ws.Invasions || [])
    .filter(i => !i.Completed)
    .map(i => ({
      node: i.Node,
      attackerFaction: i.Faction,
      defenderFaction: i.DefenderFaction,
      attackerReward: i.AttackerReward?.countedItems?.[0]?.ItemType || null,
      defenderReward: i.DefenderReward?.countedItems?.[0]?.ItemType || null,
      progress: Math.abs(i.Count) / i.Goal,
      count: i.Count,
      goal: i.Goal,
      activation: parseDate(i.Activation),
    }));
}

export function extractVoidStorms(ws) {
  return (ws.VoidStorms || []).map(s => ({
    node: s.Node,
    activation: parseDate(s.Activation),
    expiry: parseDate(s.Expiry),
    tier: s.ActiveMissionTier,
  }));
}

export function extractNightwave(ws) {
  const info = ws.SeasonInfo;
  if (!info) return null;
  return {
    tag: info.AffiliationTag,
    activation: parseDate(info.Activation),
    expiry: parseDate(info.Expiry),
    challenges: (info.ActiveChallenges || []).map(c => ({
      challenge: c.Challenge,
      activation: parseDate(c.Activation),
      expiry: parseDate(c.Expiry),
      isDaily: c.Daily || false,
    })),
  };
}

export function extractDailyDeal(ws) {
  const deals = ws.DailyDeals || [];
  if (deals.length === 0) return null;
  const d = deals[0];
  return {
    item: d.StoreItem,
    activation: parseDate(d.Activation),
    expiry: parseDate(d.Expiry),
    discount: d.Discount,
    originalPrice: d.OriginalPrice,
    salePrice: d.SalePrice,
    total: d.AmountTotal,
    sold: d.AmountSold,
  };
}

export function extractCycles(ws) {
  const time = ws.Time;
  // Earth: 8h cycle, 4h day + 4h night
  const earthSec = time % 28800;
  const earthIsDay = earthSec < 14400;
  const earthRemaining = earthIsDay ? 14400 - earthSec : 28800 - earthSec;

  // Cetus: same as Earth but offset
  const cetusSec = (time + 3000) % 8998; // ~2.5h cycle
  const cetusIsDay = cetusSec < 6000; // ~100min day
  const cetusRemaining = cetusIsDay ? 6000 - cetusSec : 8998 - cetusSec;

  // Vallis: 20min cycle (warm 6:40, cold 13:20)
  const vallisSec = time % 1600;
  const vallisIsWarm = vallisSec < 400;
  const vallisRemaining = vallisIsWarm ? 400 - vallisSec : 1600 - vallisSec;

  // Cambion: 30min cycle
  const cambionSec = time % 1800;
  const cambionIsFass = cambionSec < 900;
  const cambionRemaining = cambionIsFass ? 900 - cambionSec : 1800 - cambionSec;

  return {
    earth: { isDay: earthIsDay, remaining: earthRemaining },
    cetus: { isDay: cetusIsDay, remaining: cetusRemaining },
    vallis: { isWarm: vallisIsWarm, remaining: vallisRemaining },
    cambion: { isFass: cambionIsFass, remaining: cambionRemaining },
  };
}

export function extractCircuit(ws) {
  const choices = ws.EndlessXpChoices || [];
  return choices.map(c => ({
    category: c.Category,
    choices: c.Choices || [],
  }));
}
