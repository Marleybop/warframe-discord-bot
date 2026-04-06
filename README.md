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

## Quick Start

```bash
git clone https://github.com/Marleybop/warframe-discord-bot.git
cd warframe-discord-bot
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
git clone https://github.com/Marleybop/warframe-discord-bot.git
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

## Running as a Service

By default the bot runs in your terminal and stops when you close it. To keep it running 24/7, set it up as a service.

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
