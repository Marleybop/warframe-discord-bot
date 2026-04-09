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
