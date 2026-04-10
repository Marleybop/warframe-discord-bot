# Warframe Tracker

Discord bot that tracks Warframe world state with live-updating embeds and interactive slash commands. Powered by DE's official API, warframe.market, and warframestat.us.

## Features

### Live Trackers (19 channels)

Each tracker owns a single message and edits it every 60 seconds — no spam, just a constantly-refreshing dashboard. News posts new articles as they appear.

| Category | Trackers |
|---|---|
| **Missions** | Void Fissures, Void Storms, Sortie, Archon Hunt |
| **Traders** | Baro Ki'Teer, Varzia (Prime Resurgence), Darvo's Deal |
| **World** | World Cycles (Earth, Cetus, Vallis, Cambion, Zariman, Duviri), Invasions, Alerts, Events, News |
| **Endgame** | Nightwave, Steel Path, Deep Archimedea, The Circuit |
| **Other** | Global Boosters, Fomorian/Razorback, 1999 Calendar |

### Slash Commands (10 commands)

All responses are **ephemeral** — only the user who typed the command sees the result.

| Command | Description |
|---|---|
| `/price <item>` | Market prices (48h + 90d stats, set breakdowns) |
| `/where <item>` | Drop locations and sources (wiki fallback) |
| `/relic <name>` | Relic contents grouped by rarity |
| `/warframe <name>` | Stats, abilities, augments, components, farm locations |
| `/weapon <name>` | Stats, damage, incarnon, riven dispo, components |
| `/mod <name>` | Stats per rank, drop sources, mod card image |
| `/riven <weapon>` | Live riven auctions with stat/price/roll filters |
| `/ducats [item]` | Ducat value of a Prime part or set (or top 20) |
| `/vaulted [category]` | Browse all vaulted Prime items |
| `/help` | Command reference and bot info |

### Visual Features

- Merged reward images on invasions (both attacker + defender)
- Relic tier thumbnails on fissures
- Planet images on Baro's relay location
- Item thumbnails on Darvo's deal and events
- Mod card images from the wiki
- Optional custom Warframe-themed emojis for currencies and resources

### Infrastructure

- **SQLite caching** — API responses cached with TTL, stale fallback on failure
- **Autocomplete** — all slash commands have type-filtered autocomplete
- **Auto-registration** — slash commands register on startup
- **Daily data updates** — WFCD game data refreshes every 24h
- **Custom emojis** — optional Warframe icons for currencies/factions/resources

## Prerequisites

- **Node.js 18+** — check with `node -v`
- **Git** — check with `git --version`

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Marleybop/warframe-discord-bot.git
cd warframe-discord-bot
npm install
npm run update-data
```

### 2. Create a Discord bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, name it
3. **Bot** tab > Reset Token > copy the token
4. **OAuth2 > URL Generator** > tick `bot` and `applications.commands`
5. Under **Bot Permissions**, tick: Send Messages, Embed Links, Read Message History, View Channels, Attach Files, Use External Emojis
6. Open the generated URL to invite the bot to your server

### 3. Configure

Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id

# Optional: custom Warframe emojis (uses 34 server emoji slots)
USE_CUSTOM_EMOJIS=false

# Add channel IDs for trackers you want (leave blank to disable)
FISSURE_CHANNEL_ID=123456789
BARO_CHANNEL_ID=123456789
# ... etc
```

Get channel IDs: Discord Settings > Advanced > Developer Mode > right-click channel > Copy Channel ID.

### 4. Custom emojis (optional)

To use Warframe-themed icons for currencies, factions, and resources:

1. Set `USE_CUSTOM_EMOJIS=true` in `.env`
2. Run `npm run setup-emojis` to upload icons to your server
3. Restart the bot

This uses 34 of your server's emoji slots. Without this, the bot uses Unicode emoji fallbacks where they existed originally, and no emoji for currencies/resources.

### 5. Start

```bash
npm start
```

## Available Channel IDs

```env
FISSURE_CHANNEL_ID=
BARO_CHANNEL_ID=
SORTIE_CHANNEL_ID=
ARCHON_CHANNEL_ID=
INVASIONS_CHANNEL_ID=
STORMS_CHANNEL_ID=
CYCLES_CHANNEL_ID=
DARVO_CHANNEL_ID=
NIGHTWAVE_CHANNEL_ID=
CIRCUIT_CHANNEL_ID=
ALERTS_CHANNEL_ID=
BOOSTERS_CHANNEL_ID=
EVENTS_CHANNEL_ID=
VARZIA_CHANNEL_ID=
ARCHIMEDEA_CHANNEL_ID=
FOMORIAN_CHANNEL_ID=
STEELPATH_CHANNEL_ID=
NEWS_CHANNEL_ID=
CALENDAR_CHANNEL_ID=
BOT_COMMANDS_CHANNEL_ID=
```

## Project Structure

```
src/
  bot.js              # Discord client, update loop, startup
  config.js           # ENV loading, channel mapping
  commands/           # Slash commands + autocomplete
    definitions.js    # Command registration definitions
    index.js          # Command router + interaction handler
    autocomplete.js   # Type-filtered autocomplete
    price.js          # /price
    where.js          # /where
    relic.js          # /relic
    warframe.js       # /warframe
    weapon.js         # /weapon
    mod.js            # /mod
    riven.js          # /riven
    ducats.js         # /ducats
    vaulted.js        # /vaulted
    help.js           # /help
    guide.js          # Bot guide embeds
  trackers/           # Live-updating channel trackers
    index.js          # Tracker registry
    fissures.js       # One file per tracker
    baro.js
    ... (19 total)
  services/           # External API clients
    warframe-api.js   # DE worldstate
    warframestat.js   # warframestat.us (items, drops)
    market.js         # warframe.market (prices, orders)
    cache.js          # SQLite caching layer
  utils/
    warframe-data.js  # Name lookups (items, nodes, factions)
    emojis.js         # Centralized emoji system (custom + Unicode)
    embed-helpers.js  # Shared colors, formatting, progress bars
    image-merge.js    # Sharp-based image compositing
scripts/
  setup.js            # One-command setup
  setup-emojis.js     # Upload custom emojis to Discord server
  update-data.js      # Download WFCD game data
data/                 # Game data files (auto-updated)
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Set DISCORD_TOKEN in .env` | Paste your bot token in `.env` |
| `Missing Access` | Bot needs View Channels, Send Messages, Embed Links, Read Message History, Attach Files, Use External Emojis |
| Codes like `SolNode51` | Run `npm run update-data` |
| Slash commands not appearing | Ensure `CLIENT_ID` and `GUILD_ID` are set, restart the bot |
| No autocomplete suggestions | Wait for `[autocomplete] Ready` in console on startup |
| Custom emojis not showing | Run `npm run setup-emojis`, set `USE_CUSTOM_EMOJIS=true`, restart |
| Emoji upload rate limited | Wait a few minutes and run `npm run setup-emojis` again |

## Scripts

```bash
npm start                # Start the bot
npm run dev              # Start with auto-reload on file changes
npm run update-data      # Refresh game data from WFCD
npm run register-commands  # Manually register slash commands
npm run setup-emojis     # Upload custom emojis to your server
```

## Requirements

- **Runtime:** Node.js 18+
- **Dependencies:** discord.js, sharp, better-sqlite3

## License

MIT
