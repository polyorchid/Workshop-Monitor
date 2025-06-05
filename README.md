# Workshop-Monitor
# Steam Workshop Monitor

A Discord bot that monitors Steam Workshop mods for updates and sends notifications to your Discord channel when mods are updated.

![Node.js](https://img.shields.io/badge/node.js-v16+-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Status](https://img.shields.io/badge/status-stable-brightgreen)

## Features

- 🔍 **Real-time monitoring** of Steam Workshop mods
- 📂 **Category organization** for different mod types
- 🎯 **Accurate update detection** using Steam changelog data
- ⏰ **Configurable check intervals** (in minutes)
- 🚫 **No false positives** - only notifies on actual updates
- 📱 **Rich Discord embeds** with mod information and links
- 💾 **Persistent data storage** to remember mod states
- 🔄 **Automatic recovery** from errors and rate limits

## Screenshots

### Connection Notification
![Connection Message](https://via.placeholder.com/500x200/4CAF50/ffffff?text=Workshop+Monitor+Connected)

### Update Notification
![Update Message](https://via.placeholder.com/500x200/FF9800/ffffff?text=Mod+Updated+Notification)

## Prerequisites

- **Node.js** v16 or higher
- **npm** (comes with Node.js)
- **Discord webhook URL**
- **Steam Workshop mod URLs** you want to monitor

## Quick Start

### 1. Installation

```bash
# Clone or download this repository
git clone https://github.com/yourusername/steam-workshop-monitor.git
cd steam-workshop-monitor

# Install dependencies
npm install axios
```

### 2. Configuration

Run the bot once to generate a config file:

```bash
node workshop-monitor.js
```

This creates `config.json`. Edit it with your settings:

```json
{
    "webhookUrl": "YOUR_DISCORD_WEBHOOK_URL_HERE",
    "checkIntervalMinutes": 10.0,
    "steamApiKey": "YOUR_STEAM_API_KEY_HERE",
    "modCategories": {
        "Essential Mods": [
            "https://steamcommunity.com/sharedfiles/filedetails/?id=123456789",
            "https://steamcommunity.com/sharedfiles/filedetails/?id=987654321"
        ],
        "Graphics Mods": [
            "https://steamcommunity.com/sharedfiles/filedetails/?id=555666777"
        ]
    }
}
```

### 3. Setup Discord Webhook

1. Go to your Discord server settings
2. Navigate to **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Choose the channel for notifications
5. Copy the webhook URL
6. Paste it into your `config.json`

### 4. Run the Bot

```bash
node workshop-monitor.js
```

## Configuration Options

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `webhookUrl` | String | Discord webhook URL | `https://discord.com/api/webhooks/...` |
| `checkIntervalMinutes` | Number | Minutes between checks | `10.0` (10 minutes) |
| `steamApiKey` | String | Optional Steam API key for better reliability | `ABC123...` |
| `modCategories` | Object | Organized mod lists | See example above |

### Check Interval Examples

- `0.5` = 30 seconds
- `2.5` = 2 minutes 30 seconds  
- `10` = 10 minutes
- `60` = 1 hour

## Adding Mods

Simply add Steam Workshop URLs to your config file:

1. Visit the mod's Steam Workshop page
2. Copy the URL (e.g., `https://steamcommunity.com/sharedfiles/filedetails/?id=123456789`)
3. Add it to the appropriate category in `config.json`
4. Restart the bot

## File Structure

```
steam-workshop-monitor/
├── workshop-monitor.js    # Main bot file
├── config.json           # Configuration (auto-generated)
├── mod_data.json         # Mod tracking data (auto-generated)
├── webhook_data.json     # Webhook state (auto-generated)
├── package.json          # Dependencies
├── README.md             # This file
└── LICENSE               # License information
```

## Deployment Options

### Local Development
```bash
node workshop-monitor.js
```

### Production with PM2
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start workshop-monitor.js --name "workshop-bot"

# Auto-start on system boot
pm2 startup
pm2 save
```

### Raspberry Pi Setup
Perfect for 24/7 monitoring with low power consumption:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and start bot
sudo npm install -g pm2
pm2 start workshop-monitor.js --name "workshop-bot"
pm2 startup
pm2 save
```

### Cloud Hosting
- **Railway**: $5/month, simple deployment
- **DigitalOcean**: $5-6/month VPS
- **Render**: Free tier available

## Troubleshooting

### Common Issues

**Bot sends notifications for old mods on first run**
- This is normal - the bot records baseline data first
- Future runs will only notify on actual updates

**Rate limiting errors (429)**
- Increase `checkIntervalMinutes` in config
- The bot has built-in retry logic

**Mod not detected as updated**
- Check if the mod actually has a changelog entry
- Some mods don't update their changelog properly

**Bot stops working**
- Check console logs for errors
- Verify webhook URL is still valid
- Ensure config.json syntax is correct

### Debug Commands

```bash
# Check bot status (with PM2)
pm2 status

# View logs
pm2 logs workshop-bot

# Test config file
node -c workshop-monitor.js
```

## API Rate Limits

The bot respects Steam's rate limits and Discord's webhook limits:

- **Steam**: Automatic delays between requests
- **Discord**: Built-in retry logic for rate limits
- **Recommendation**: Don't set check interval below 5 minutes for large mod lists

## Steam API Key (Optional)

For better reliability, get a Steam API key:

1. Visit https://steamcommunity.com/dev/apikey
2. Register for a key
3. Add it to your `config.json`

Without an API key, the bot uses web scraping (still works, but slightly slower).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- Steam Workshop monitoring
- Discord webhook notifications
- Category organization
- Configurable intervals

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/steam-workshop-monitor/issues)
- **Discord**: [Your Discord Server](#)
- **Email**: your-email@example.com

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Created by **Foostus**

Special thanks to the Discord.js and Steam communities for inspiration and support.

---

⭐ **Star this repository if you find it helpful!**
