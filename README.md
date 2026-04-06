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

You need two things installed before starting:

**1. Node.js 18 or higher**

Check if you have it: open a terminal and run `node -v`. If it prints `v18.0.0` or higher, you're good. If not, install it:

- **Windows**: Go to [nodejs.org](https://nodejs.org/), download the **LTS** installer, and run it. Accept all defaults.
- **macOS**: Go to [nodejs.org](https://nodejs.org/) and download the **LTS** installer, or run `brew install node` if you use Homebrew.
- **Ubuntu/Debian**: Run these two commands:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
  sudo apt install -y nodejs
  ```
- **Arch**: Run `sudo pacman -S nodejs npm`

After installing, verify with `node -v` and `npm -v` — both should print a version number.

**2. Git**

Check if you have it: run `git --version`. If not:

- **Windows**: Download from [git-scm.com](https://git-scm.com/download/win) and install with defaults.
- **macOS**: Run `xcode-select --install` or download from [git-scm.com](https://git-scm.com/download/mac).
- **Linux**: Run `sudo apt install git` (Ubuntu/Debian) or `sudo pacman -S git` (Arch).

## Creating a Discord Bot

You need to do this **before** setup, because the bot won't start without a token.

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) and log in
2. Click the **New Application** button in the top right. Give it a name (e.g. "Warframe Tracker")
3. In the left sidebar, click **Bot**
4. Click **Reset Token**, then **Yes, do it!**
5. Click **Copy** — save this token somewhere safe (you'll need it in a moment). You can only see it once.
6. In the left sidebar, click **OAuth2**, then **URL Generator**
7. Under **Scopes**, tick `bot`
8. Under **Bot Permissions** (appears after ticking bot), tick these four:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
   - `View Channels`
9. Scroll down and copy the **Generated URL**
10. Open that URL in your browser, pick your Discord server from the dropdown, and click **Authorize**

The bot should now appear in your server (offline until you start it).

## Setup

### Step 1 — Clone and install

Open a terminal and run:

```bash
git clone https://github.com/Marleybop/warframe-discord-bot.git
cd warframe-discord-bot
npm run setup
```

You should see it install `discord.js` and download game data files. If you get an error like `npm: command not found`, go back to Prerequisites and install Node.js.

### Step 2 — Configure the bot

Open the `.env` file in any text editor (Notepad, nano, VS Code — whatever you have).

Paste your bot token after `DISCORD_TOKEN=`:

```env
DISCORD_TOKEN=paste_your_token_here
```

Then add channel IDs for the trackers you want. To get a channel ID:
1. In Discord, go to **Settings > Advanced** and turn on **Developer Mode**
2. Right-click the channel you want to use > **Copy Channel ID**
3. Paste it after the `=` sign

```env
DISCORD_TOKEN=paste_your_token_here
REFRESH_INTERVAL_SECONDS=60

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

Leave any line blank to disable that tracker. You can use the same channel ID for multiple trackers if you want them all in one place.

### Step 3 — Start the bot

```bash
npm start
```

You should see output like:

```
Logged in as YourBot#1234
Active trackers: fissures, baro, sortie
Refresh: 60s
```

The bot will post embeds in your channels and update them every 60 seconds.

To stop the bot, press `Ctrl+C`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm: command not found` | Node.js isn't installed. See Prerequisites. |
| `git: command not found` | Git isn't installed. See Prerequisites. |
| `Set DISCORD_TOKEN in .env` | You didn't paste your bot token into the `.env` file. |
| `Missing Access` in the console | The bot can't see or send messages in that channel. Go to Server Settings > Roles > find the bot's role > enable View Channels, Send Messages, Embed Links, Read Message History. If the channel is private, you also need to add the bot's role in the channel permissions. |
| Bot is online but no embeds appear | Make sure you put the correct channel ID in `.env` and restarted the bot. |
| Embeds show codes like `SolNode51` | Run `npm run update-data` to refresh the game data files. |

## Updating Game Data

The `data/` folder contains node names, item names, and sortie data from the [WFCD](https://github.com/WFCD) community. If names look wrong after a Warframe update:

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

1. Open **Task Scheduler** (search for it in the Start menu)
2. Click **Create Basic Task** on the right side
3. Name: `Warframe Tracker`, click Next
4. Trigger: select **When the computer starts**, click Next
5. Action: select **Start a program**, click Next
6. Fill in:
   - **Program/script**: the full path to node, e.g. `C:\Program Files\nodejs\node.exe` (run `where node` in a terminal to find it)
   - **Add arguments**: `src\bot.js`
   - **Start in**: the full path to the project folder, e.g. `C:\Users\YourName\warframe-discord-bot`
7. Click Finish
8. Find the task in the list, right-click it > **Properties**
9. Check **Run whether user is logged on or not**
10. On the **Settings** tab, check **If the task fails, restart every** and set it to `1 minute`
11. Click OK

### Linux — systemd

Create the service file:

```bash
sudo nano /etc/systemd/system/warframe-tracker.service
```

Paste the following. **You must replace the `User` and `WorkingDirectory` values:**

- Run `whoami` to get your username
- Run `pwd` inside the project folder to get the full path
- **Important:** if you're running as `root`, the home folder is `/root/`, NOT `/home/root/`

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

Save the file (`Ctrl+O`, Enter, `Ctrl+X` in nano), then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable warframe-tracker
sudo systemctl start warframe-tracker
```

Check it's running:

```bash
sudo systemctl status warframe-tracker
```

If you see `active (running)`, it's working. To view live logs:

```bash
journalctl -u warframe-tracker -f
```

> **If you see `status=217/USER`**: the `User=` value in the service file doesn't match a real user on your system. Fix it, save, run `sudo systemctl daemon-reload`, then `sudo systemctl restart warframe-tracker`.

### macOS — launchd

Create the file `~/Library/LaunchAgents/com.warframe.tracker.plist`. **Replace `youruser` with your macOS username** (run `whoami` to check):

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

To check logs: `cat /tmp/warframe-tracker.log`

## Requirements

- **Runtime:** Node.js 18+ (uses native `fetch`, no HTTP library needed)
- **npm dependency:** `discord.js` (the only package installed)

## License

MIT
