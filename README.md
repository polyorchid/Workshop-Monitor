# Steam Workshop Monitor

A simple Discord bot that watches Steam Workshop mods and notifies you when they update.

## What it does

- Monitors Steam Workshop mods for updates
- Sends Discord notifications when mods are updated
- Organizes mods into categories
- Runs 24/7 in the background

## Installation

### 1. Download
```bash
git clone https://github.com/polyorchid/Workshop-Monitor.git
cd Workshop-Monitor
```

### 2. Install Node.js
Download and install Node.js from https://nodejs.org (version 16 or higher)

### 3. Install Dependencies
```bash
npm install axios
```

## Setup

### 1. Create Discord Webhook
1. Go to your Discord server settings
2. Click **Integrations** → **Webhooks** 
3. Click **Create Webhook**
4. Choose the channel where you want notifications
5. Copy the webhook URL

### 2. First Run
```bash
node workshop-monitor.js
```

This creates a `config.json` file. The bot will exit and tell you to edit it.

### 3. Edit Config File
Open `config.json` and fill it out:

```json
{
    "webhookUrl": "YOUR_DISCORD_WEBHOOK_URL_HERE",
    "checkIntervalMinutes": 10.0,
    "steamApiKey": "YOUR_STEAM_API_KEY_HERE",
    "botName": "Workshop Monitor", 
    "botAvatarUrl": "https://i.imgur.com/example.png",
    "modCategories": {
        "Essential Mods": [
            "https://steamcommunity.com/sharedfiles/filedetails/?id=123456789"
        ],
        "Graphics Mods": [
            "https://steamcommunity.com/sharedfiles/filedetails/?id=987654321"
        ]
    }
}
```

**Required:**
- `webhookUrl` - Your Discord webhook URL
- `modCategories` - Your mod URLs organized by category

**Optional:**
- `checkIntervalMinutes` - How often to check (default: 10 minutes)
- `steamApiKey` - Get from https://steamcommunity.com/dev/apikey (recommended)
- `botName` - Custom name for your bot
- `botAvatarUrl` - Custom avatar image URL

### 4. Add Your Mods
1. Go to a Steam Workshop mod page
2. Copy the URL (like `https://steamcommunity.com/sharedfiles/filedetails/?id=123456789`)
3. Add it to a category in your config
4. Repeat for all mods you want to monitor

### 5. Run the Bot
```bash
node workshop-monitor.js
```

## What to Expect

### First Time Running
1. **Discord**: You'll get a green "Workshop Monitor Connected" message
2. **Console**: Bot will record baseline data for all your mods
3. **No Notifications**: Won't send update alerts for existing mods

### When a Mod Updates
1. **Discord**: You'll get a notification with:
   - Mod name
   - Category 
   - When it was updated
   - Link to the mod
2. **Console**: Bot will log which mod was updated

### Normal Operation
- **Console**: Shows "No mod updates found" every check
- **Discord**: Only sends messages when mods actually update
- **Quiet**: Bot runs silently in the background

## Running 24/7

### Simple Method
Just leave the terminal window open with the bot running.

### Better Method (PM2)
```bash
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start workshop-monitor.js --name "workshop-bot"

# Make it auto-start on computer restart
pm2 startup
pm2 save
```

## Troubleshooting

**"Cannot find module 'axios'"**
- Run `npm install axios`

**Bot says "webhookUrl is required"**
- Make sure you pasted your Discord webhook URL in the config

**Getting 502 errors in console**
- This is normal - Steam servers sometimes have issues
- Bot will work again when Steam is back up

**No notifications on first run**
- This is normal - bot needs to learn your mods first
- Next time mods update, you'll get notifications

## Support

- **Issues**: https://github.com/polyorchid/Workshop-Monitor/issues
- **Credits**: Created by Foostus
