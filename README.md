# Warframe Tracker

Discord bot that posts live-updating Warframe world state data into your server channels. Each tracker owns a single message and edits it on a timer — no spam, just a constantly-refreshing dashboard.

## Trackers

| Tracker | What it shows |
|---|---|
| **Fissures** | All active void fissures grouped by relic tier (Lith through Omnia) |
| **Baro Ki'Teer** | Arrival countdown, relay location, and full inventory when active |
| **Sortie** | Daily 3-mission sortie with boss, modifiers, and node names |
| **Archon Hunt** | Weekly archon, missions, and locations |
| **Invasions** | Faction wars with reward names and visual progress bars |
| **Void Storms** | Railjack fissures with relic tier and mission type |
| **World Cycles** | Earth, Cetus, Orb Vallis, and Cambion Drift day/night status |
| **Darvo's Deal** | Daily deal with discount, price, and stock remaining |
| **Nightwave** | Active daily/weekly/elite challenges with full descriptions |
| **The Circuit** | This week's Warframe and weapon choices |

## Quick Start

Requires [Node.js 18+](https://nodejs.org/).

```bash
git clone https://github.com/YOUR_USERNAME/warframe-tracker.git
cd warframe-tracker
npm run setup
```

The setup script will:
1. Create a `.env` file from the template
2. Install dependencies (just `discord.js`)
3. Download the latest game data files

Then edit `.env` with your bot token and channel IDs, and run:

```bash
npm start
```

## Manual Setup

```bash
git clone https://github.com/YOUR_USERNAME/warframe-tracker.git
cd warframe-tracker
npm install
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
FISSURE_CHANNEL_ID=123456789012345678
BARO_CHANNEL_ID=123456789012345678
```

Run:
```bash
npm start
```

## Creating a Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** > name it
3. **Bot** tab > **Reset Token** > copy and save it
4. **OAuth2 > URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`, `View Channels`
5. Open the generated URL > select your server > authorize

## Getting Channel IDs

1. Discord Settings > Advanced > enable **Developer Mode**
2. Right-click any channel > **Copy Channel ID**
3. Paste into `.env` next to the matching tracker

Leave any channel ID blank to disable that tracker.

## Updating Game Data

The `data/` folder contains node names, item names, and sortie data from the [WFCD](https://github.com/WFCD) community. To update after a Warframe patch:

```bash
npm run update-data
```

## How It Works

- Fetches world state from DE's official endpoint (`content.warframe.com/dynamic/worldState.php`)
- Parses the raw data into clean structures
- Builds Discord embeds for each tracker
- Posts one message per tracker, then edits it every 60 seconds
- Zero external API dependencies — talks directly to DE's servers

## Project Structure

```
warframe-tracker/
  .env.example       # Template for configuration
  package.json        # Dependencies and scripts
  data/               # WFCD game data (node names, items, sortie info)
  scripts/
    setup.js          # One-command setup
    update-data.js    # Refresh game data files
  src/
    bot.js            # Discord client, update loop, message tracking
    api.js            # Fetch and parse DE worldstate
    embeds.js         # Build Discord embeds for each tracker
    warframe-data.js  # Name lookups (nodes, items, bosses, modifiers)
```

## Requirements

- Node.js 18+ (uses native `fetch`, no HTTP library needed)
- One dependency: `discord.js`

## License

MIT
