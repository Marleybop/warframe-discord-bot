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

## Prerequisites

You need **Node.js 18 or higher** installed. Check with `node -v` — if it's missing or below v18, install it:

| OS | Install |
|---|---|
| **Windows** | Download the installer from [nodejs.org](https://nodejs.org/) (LTS recommended) |
| **macOS** | `brew install node` or download from [nodejs.org](https://nodejs.org/) |
| **Ubuntu/Debian** | `curl -fsSL https://deb.nodesource.com/setup_22.x \| sudo bash - && sudo apt install -y nodejs` |
| **Fedora/RHEL** | `curl -fsSL https://rpm.nodesource.com/setup_22.x \| sudo bash - && sudo dnf install -y nodejs` |
| **Arch** | `sudo pacman -S nodejs npm` |
| **Any (via nvm)** | `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh \| bash && nvm install 22` |

You also need a Discord bot. If you don't have one yet, see [Creating a Discord Bot](#creating-a-discord-bot) below.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Marleybop/warframe-discord-bot.git
cd warframe-discord-bot
npm run setup
```

This will install dependencies, download game data, and create a `.env` file.

### 2. Configure `.env`

Open `.env` in any text editor and fill in your bot token and channel IDs:

```env
# Your bot token (see "Creating a Discord Bot" below)
DISCORD_TOKEN=your_bot_token_here

# How often to refresh data (in seconds)
REFRESH_INTERVAL_SECONDS=60

# Add channel IDs for the trackers you want active.
# Leave blank to disable a tracker.
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
```

To get a channel ID: Discord Settings > Advanced > enable **Developer Mode**, then right-click any channel > **Copy Channel ID**.

You can put multiple trackers in the same channel or give each their own — your choice.

### 3. Start the bot

```bash
npm start
```

You should see the bot log in and start posting embeds in your channels.

## Creating a Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to the **Bot** tab > click **Reset Token** > copy and save it somewhere safe
4. Go to **OAuth2 > URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`, `View Channels`
5. Copy the generated URL, open it in your browser, select your server, and authorize

Paste the token into `DISCORD_TOKEN` in your `.env` file. Never share your token publicly.

## Updating Game Data

The `data/` folder contains node names, item names, and sortie data from the [WFCD](https://github.com/WFCD) community. If names look wrong after a Warframe update, refresh them:

```bash
npm run update-data
```

## How It Works

- Fetches world state directly from DE's official endpoint every 60 seconds
- Parses the raw data into clean structures
- Builds Discord embeds for each active tracker
- Posts one message per tracker, then edits it each cycle — no message spam
- Zero external API dependencies — talks directly to DE's servers

## Project Structure

```
warframe-discord-bot/
  .env.example       # Template for configuration
  package.json       # Dependencies and scripts
  data/              # WFCD game data (node names, items, sortie info)
  scripts/
    setup.js         # One-command setup
    update-data.js   # Refresh game data files
  src/
    bot.js           # Discord client, update loop, message tracking
    api.js           # Fetch and parse DE worldstate
    embeds.js        # Build Discord embeds for each tracker
    warframe-data.js # Name lookups (nodes, items, bosses, modifiers)
```

## Running as a Service

By default the bot runs in your terminal and stops when you close it. To keep it running 24/7, set it up as a background service.

### Windows — Task Scheduler

1. Open **Task Scheduler** (search for it in Start)
2. Click **Create Basic Task**
3. Name: `Warframe Tracker`
4. Trigger: **When the computer starts**
5. Action: **Start a program**
   - Program: `node`
   - Arguments: `src/bot.js`
   - Start in: `C:\path\to\warframe-discord-bot`
6. Finish, then right-click the task > **Properties**:
   - Check **Run whether user is logged on or not**
   - Check **Restart the task if it fails** (set to every 1 minute)

### Linux — systemd

Create the service file:

```bash
sudo nano /etc/systemd/system/warframe-tracker.service
```

```ini
[Unit]
Description=Warframe Discord Tracker
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/warframe-discord-bot
ExecStart=/usr/bin/node src/bot.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable warframe-tracker
sudo systemctl start warframe-tracker

# Check status
sudo systemctl status warframe-tracker

# View logs
journalctl -u warframe-tracker -f
```

### macOS — launchd

Create `~/Library/LaunchAgents/com.warframe.tracker.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.warframe.tracker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>src/bot.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/youruser/warframe-discord-bot</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/warframe-tracker.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/warframe-tracker.err</string>
</dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.warframe.tracker.plist
```

### Hosting Options

If you don't want to keep your own machine running 24/7:

| Option | Cost | Notes |
|---|---|---|
| **Oracle Cloud** | Free forever | ARM instance, always-free tier |
| **Raspberry Pi** | ~$35 one-time | Runs on your home network |
| **Hetzner VPS** | ~$4/mo | Cheap, reliable EU/US servers |
| **Railway** | Free tier available | Deploy from GitHub, auto-restarts |

## Requirements

- **Runtime:** Node.js 18+ (uses native `fetch`, no HTTP library needed)
- **npm dependency:** `discord.js` (the only package installed)

## License

MIT
