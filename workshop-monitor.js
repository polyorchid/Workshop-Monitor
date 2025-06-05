const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class WorkshopModMonitor {
    constructor() {
        this.configFile = 'config.json';
        this.dataFile = 'mod_data.json';
        this.config = {};
        this.modCategories = {};
        this.lastChecked = {};
        
        this.init();
    }

    async init() {
        try {
            // Load configuration
            await this.loadConfig();
            
            // Parse Steam URLs to extract mod IDs FIRST
            this.parseModUrls();
            
            // Check if this is a new webhook and send test message AFTER parsing
            await this.checkAndSendTestMessage();
            
            // Load previous mod data
            const data = await fs.readFile(this.dataFile, 'utf8');
            this.lastChecked = JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT' && error.path && error.path.includes('config.json')) {
                console.log('Config file not found, creating default config.json');
                await this.createDefaultConfig();
                return;
            } else if (error.code === 'ENOENT') {
                console.log('No previous data found, starting fresh');
                this.lastChecked = {};
            } else {
                console.error('Error during initialization:', error.message);
                return;
            }
        }

        console.log('Workshop mod monitor started');
        console.log(`Monitoring ${Object.keys(this.modCategories).length} mod categories`);
        this.startMonitoring();
    }

    async checkAndSendTestMessage() {
        const webhookDataFile = 'webhook_data.json';
        let webhookData = {};
        
        try {
            const data = await fs.readFile(webhookDataFile, 'utf8');
            webhookData = JSON.parse(data);
        } catch (error) {
            // File doesn't exist, create new one
            webhookData = {};
        }
        
        // Check if this webhook URL is new
        const currentWebhook = this.config.webhookUrl;
        if (!webhookData.lastWebhook || webhookData.lastWebhook !== currentWebhook) {
            console.log('New webhook detected, sending test message...');
            await this.sendTestMessage();
            
            // Save the new webhook
            webhookData.lastWebhook = currentWebhook;
            webhookData.lastTestSent = new Date().toISOString();
            
            try {
                await fs.writeFile(webhookDataFile, JSON.stringify(webhookData, null, 2));
            } catch (error) {
                console.error('Failed to save webhook data:', error.message);
            }
        }
    }

    async sendTestMessage() {
        const embed = {
            title: "✅ Workshop Monitor Connected",
            color: 0x00FF00, // Bright green
            description: "Your Steam Workshop mod monitor is now active and connected to this Discord channel!",
            fields: [
                {
                    name: "📊 Monitoring Status",
                    value: `Currently tracking **${Object.values(this.modCategories).flat().length}** mods across **${Object.keys(this.modCategories).length}** categories`,
                    inline: false
                },
                {
                    name: "⏰ Check Interval",
                    value: `Checking for updates every **${this.config.checkIntervalMinutes || 5.0} minutes**`,
                    inline: true
                },
                {
                    name: "🔔 Notifications",
                    value: "You'll be notified when any tracked mod receives an update",
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: "Workshop Monitor • Test Message • Credits: Foostus"
            }
        };

        const payload = {
            embeds: [embed]
        };

        try {
            await axios.post(this.config.webhookUrl, payload);
            console.log('Test message sent successfully');
        } catch (error) {
            console.error('Failed to send test message:', error.message);
        }
    }

    async loadConfig() {
        const configData = await fs.readFile(this.configFile, 'utf8');
        this.config = JSON.parse(configData);
        
        // Validate required config
        if (!this.config.webhookUrl) {
            throw new Error('webhookUrl is required in config.json');
        }
        
        if (!this.config.modCategories || Object.keys(this.config.modCategories).length === 0) {
            throw new Error('modCategories is required in config.json');
        }
    }

    async createDefaultConfig() {
        const defaultConfig = {
            "webhookUrl": "YOUR_DISCORD_WEBHOOK_URL_HERE",
            "checkIntervalMinutes": 5.0,
            "steamApiKey": "YOUR_STEAM_API_KEY_HERE",
            "modCategories": {
                "Essential Mods": [
                    "https://steamcommunity.com/sharedfiles/filedetails/?id=123456789",
                    "https://steamcommunity.com/sharedfiles/filedetails/?id=987654321"
                ],
                "Graphics Mods": [
                    "https://steamcommunity.com/sharedfiles/filedetails/?id=555666777",
                    "https://steamcommunity.com/sharedfiles/filedetails/?id=888999000"
                ],
                "Gameplay Mods": [
                    "https://steamcommunity.com/sharedfiles/filedetails/?id=111222333"
                ]
            }
        };
        
        await fs.writeFile(this.configFile, JSON.stringify(defaultConfig, null, 4));
        console.log('Created default config.json file');
        console.log('Please edit config.json with your Discord webhook URL and Steam Workshop URLs, then restart the bot');
        process.exit(0);
    }

    parseModUrls() {
        this.modCategories = {};
        
        for (const [category, urls] of Object.entries(this.config.modCategories)) {
            this.modCategories[category] = [];
            
            for (const url of urls) {
                const modId = this.extractModIdFromUrl(url);
                if (modId) {
                    this.modCategories[category].push({
                        id: modId,
                        url: url,
                        category: category
                    });
                } else {
                    console.warn(`Invalid Steam Workshop URL: ${url}`);
                }
            }
        }
        
        console.log(`Parsed mod categories:`, Object.keys(this.modCategories).map(cat => 
            `${cat}: ${this.modCategories[cat].length} mods`).join(', '));
    }

    extractModIdFromUrl(url) {
        const match = url.match(/[?&]id=(\d+)/);
        return match ? match[1] : null;
    }

    async startMonitoring() {
        // Initial check
        await this.checkForUpdates();
        
        // Convert minutes to milliseconds for setInterval
        const intervalMs = (this.config.checkIntervalMinutes || 5.0) * 60 * 1000;
        
        // Set up recurring checks
        setInterval(() => {
            this.checkForUpdates();
        }, intervalMs);
    }

    async checkForUpdates() {
        console.log('Checking for mod updates...');
        let updatesFound = 0;
        let newModsRecorded = 0;
        let modsChecked = 0;
        const isFirstRun = Object.keys(this.lastChecked).length === 0;
        
        for (const [category, mods] of Object.entries(this.modCategories)) {
            for (const mod of mods) {
                try {
                    const modInfo = await this.getModInfo(mod.id);
                    modsChecked++;
                    
                    if (modInfo) {
                        const wasTrackedBefore = this.lastChecked[mod.id];
                        
                        if (!wasTrackedBefore) {
                            // First time seeing this mod - just record it, don't notify
                            if (isFirstRun) {
                                console.log(`Recording baseline for mod ${mod.id} (${modInfo.title || 'Unknown'}): ${new Date(modInfo.time_updated * 1000)}`);
                            }
                            this.lastChecked[mod.id] = {
                                lastUpdate: modInfo.time_updated,
                                title: modInfo.title,
                                category: category
                            };
                            newModsRecorded++;
                        } else {
                            // We've seen this mod before - check for actual updates
                            const currentTimestamp = modInfo.time_updated;
                            const previousTimestamp = wasTrackedBefore.lastUpdate;
                            const timeDifference = currentTimestamp - previousTimestamp;
                            
                            // Only consider it an update if the difference is significant (more than 5 minutes)
                            // This prevents false positives from Steam API timestamp variations
                            if (timeDifference > 300) { // 5 minutes = 300 seconds
                                console.log(`🚨 REAL UPDATE DETECTED for mod ${mod.id} (${modInfo.title || 'Unknown'})`);
                                console.log(`  Previous: ${new Date(previousTimestamp * 1000)}`);
                                console.log(`  Current:  ${new Date(currentTimestamp * 1000)}`);
                                console.log(`  Time difference: ${Math.round(timeDifference / 60)} minutes`);
                                
                                // Send notification for real update
                                await this.sendModUpdateNotification(modInfo, category);
                                updatesFound++;
                                
                                // Update the record
                                this.lastChecked[mod.id] = {
                                    lastUpdate: currentTimestamp,
                                    title: modInfo.title,
                                    category: category
                                };
                            } else if (timeDifference < -300) {
                                // Timestamp went backwards significantly - this shouldn't happen normally
                                console.log(`⚠️  Warning: Mod ${mod.id} timestamp went backwards by ${Math.abs(Math.round(timeDifference / 60))} minutes`);
                            }
                            // Remove the "unchanged" logging - only show when there are actual updates
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error checking mod ${mod.id} in ${category}:`, error.message);
                }
            }
        }
        
        console.log(`\n=== Check Summary ===`);
        console.log(`Mods checked: ${modsChecked}`);
        
        if (isFirstRun || newModsRecorded > 0) {
            console.log(`First run: Recorded baseline data for ${newModsRecorded} mods (no notifications sent)`);
        }
        
        if (updatesFound > 0) {
            console.log(`🎉 Actual updates found: ${updatesFound} (notifications sent)`);
        } else if (!isFirstRun && newModsRecorded === 0) {
            console.log('✅ No mod updates found');
        }
        console.log(`=====================\n`);
        
        // Save updated data
        await this.saveData();
    }

    formatTimeSince(timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const diffSeconds = now - timestamp;
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffYears = Math.floor(diffDays / 365);

        if (diffMinutes < 60) {
            return `${diffMinutes} min ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 365) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            const remainingDays = diffDays % 365;
            if (remainingDays === 0) {
                return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
            } else {
                return `${diffYears} year${diffYears !== 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''} ago`;
            }
        }
    }

    async sendModUpdateNotification(modInfo, category) {
        const embed = {
            title: "🔧 Workshop Mod Updated",
            color: 0x4CAF50, // Green
            description: `**${modInfo.title || `Mod ${modInfo.publishedfileid}`}** has been updated!`,
            fields: [
                {
                    name: "📂 Category",
                    value: category,
                    inline: true
                },
                {
                    name: "🕐 Updated",
                    value: `<t:${Math.floor(modInfo.time_updated)}:R>`, // Discord timestamp
                    inline: true
                },
                {
                    name: "🔗 Workshop Link",
                    value: `[View on Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=${modInfo.publishedfileid})`,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: `Workshop Monitor • Mod ID: ${modInfo.publishedfileid}`
            }
        };

        const payload = {
            embeds: [embed]
        };

        try {
            await axios.post(this.config.webhookUrl, payload);
            console.log(`Update notification sent for: ${modInfo.title || modInfo.publishedfileid}`);
        } catch (error) {
            console.error('Failed to send mod update notification:', error.message);
            
            // If rate limited, add a small delay and try once more
            if (error.response && error.response.status === 429) {
                console.log('Rate limited, waiting 5 seconds and retrying...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                try {
                    await axios.post(this.config.webhookUrl, payload);
                    console.log(`Retry successful for: ${modInfo.title || modInfo.publishedfileid}`);
                } catch (retryError) {
                    console.error('Retry failed:', retryError.message);
                }
            }
        }
    }

    async getModInfo(modId) {
        // Using Steam Web API if key is provided
        if (this.config.steamApiKey && this.config.steamApiKey !== 'YOUR_STEAM_API_KEY_HERE') {
            try {
                const url = `https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`;
                const response = await axios.post(url, {
                    key: this.config.steamApiKey,
                    itemcount: 1,
                    'publishedfileids[0]': modId
                });
                
                if (response.data.response.publishedfiledetails[0].result === 1) {
                    return response.data.response.publishedfiledetails[0];
                }
            } catch (error) {
                console.log(`Steam API failed for mod ${modId}, falling back to changelog scraping`);
            }
        }
        
        // Fallback: scrape workshop changelog page for accurate timestamps
        return await this.scrapeChangelogPage(modId);
    }

    async scrapeChangelogPage(modId) {
        try {
            // First, get the mod title from the main page
            const mainUrl = `https://steamcommunity.com/sharedfiles/filedetails/?id=${modId}`;
            const mainResponse = await axios.get(mainUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const mainHtml = mainResponse.data;
            const titleMatch = mainHtml.match(/<div class="workshopItemTitle">([^<]+)<\/div>/);
            const title = titleMatch ? titleMatch[1].trim() : `Mod ${modId}`;
            
            // Now scrape the changelog page for accurate update timestamps
            const changelogUrl = `https://steamcommunity.com/sharedfiles/filedetails/changelog/${modId}`;
            // Only log changelog checking during first run or if there's an issue
            
            const changelogResponse = await axios.get(changelogUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const changelogHtml = changelogResponse.data;
            
            // Look for the most recent update timestamp
            let time_updated = Math.floor(Date.now() / 1000); // Fallback to current time
            
            // Try to find update entries like "Update: Jun 2 @ 3:23pm"
            const updatePatterns = [
                /Update:\s*([A-Za-z]{3}\s+\d{1,2}\s*@\s*\d{1,2}:\d{2}[ap]m)/gi,
                /Update:\s*([A-Za-z]{3}\s+\d{1,2},?\s*\d{4}\s*@\s*\d{1,2}:\d{2}[ap]m)/gi,
                /data-timestamp="(\d+)"/gi
            ];
            
            for (const pattern of updatePatterns) {
                const matches = Array.from(changelogHtml.matchAll(pattern));
                if (matches.length > 0) {
                    if (pattern.source.includes('data-timestamp')) {
                        // Direct timestamp found
                        time_updated = parseInt(matches[0][1]);
                        break;
                    } else {
                        // Parse the date string from the first (most recent) update
                        const dateStr = matches[0][1].trim();
                        
                        // Convert formats like "Jun 2 @ 3:23pm" to a proper date
                        const parsedDate = this.parseWorkshopDate(dateStr);
                        if (parsedDate) {
                            time_updated = Math.floor(parsedDate.getTime() / 1000);
                            break;
                        }
                    }
                }
            }
            
            return {
                publishedfileid: modId,
                title: title,
                time_updated: time_updated,
                file_url: mainUrl
            };
            
        } catch (error) {
            console.error(`❌ Failed to scrape changelog for mod ${modId}:`, error.message);
            return null;
        }
    }

    parseWorkshopDate(dateStr) {
        try {
            // Handle formats like:
            // "Jun 2 @ 3:23pm"
            // "Jun 1 @ 6:13pm" 
            // "Dec 25 @ 11:30am"
            // "Nov 7, 2023 @ 5:03am"
            
            const currentYear = new Date().getFullYear();
            
            // Extract components using regex - handle both formats with and without year
            let match = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2}),?\s*(\d{4})?\s*@\s*(\d{1,2}):(\d{2})([ap]m)/i);
            if (!match) {
                console.log(`Could not parse date format: "${dateStr}"`);
                return null;
            }
            
            const [, monthStr, day, year, hour, minute, ampm] = match;
            const useYear = year ? parseInt(year) : currentYear;
            
            // Convert month name to number
            const months = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            
            const monthNum = months[monthStr.toLowerCase()];
            if (monthNum === undefined) {
                console.log(`Unknown month: "${monthStr}"`);
                return null;
            }
            
            // Convert to 24-hour format
            let hour24 = parseInt(hour);
            if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
                hour24 += 12;
            } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
                hour24 = 0;
            }
            
            // Create date object
            const date = new Date(useYear, monthNum, parseInt(day), hour24, parseInt(minute));
            
            // If no year was specified and the date is in the future, it's probably from last year
            if (!year && date > new Date()) {
                date.setFullYear(currentYear - 1);
            }
            
            return date;
            
        } catch (error) {
            console.error(`Error parsing workshop date "${dateStr}":`, error.message);
            return null;
        }
    }

    async saveData() {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(this.lastChecked, null, 2));
        } catch (error) {
            console.error('Failed to save data:', error.message);
        }
    }

    // Method to add new mod to monitor
    addModToCategory(category, url) {
        const modId = this.extractModIdFromUrl(url);
        if (!modId) {
            console.error(`Invalid Steam Workshop URL: ${url}`);
            return false;
        }

        if (!this.modCategories[category]) {
            this.modCategories[category] = [];
        }

        // Check if mod already exists in this category
        const exists = this.modCategories[category].some(mod => mod.id === modId);
        if (!exists) {
            this.modCategories[category].push({
                id: modId,
                url: url,
                category: category
            });
            console.log(`Added mod ${modId} to category ${category}`);
            return true;
        } else {
            console.log(`Mod ${modId} already exists in category ${category}`);
            return false;
        }
    }

    // Method to remove mod from monitoring
    removeModFromCategory(category, url) {
        const modId = this.extractModIdFromUrl(url);
        if (!modId || !this.modCategories[category]) {
            return false;
        }

        const index = this.modCategories[category].findIndex(mod => mod.id === modId);
        if (index > -1) {
            this.modCategories[category].splice(index, 1);
            delete this.lastChecked[modId];
            console.log(`Removed mod ${modId} from category ${category}`);
            return true;
        }
        return false;
    }

    // Method to list all monitored mods
    listMods() {
        console.log('\n=== Currently Monitored Mods ===');
        for (const [category, mods] of Object.entries(this.modCategories)) {
            console.log(`\n${category}:`);
            mods.forEach(mod => {
                const lastCheck = this.lastChecked[mod.id];
                const status = lastCheck ? `Last updated: ${new Date(lastCheck.lastUpdate * 1000).toLocaleString()}` : 'Never checked';
                console.log(`  - ${lastCheck?.title || mod.id} (${mod.id}) - ${status}`);
            });
        }
        console.log('================================\n');
    }
}

// Start the monitor
const monitor = new WorkshopModMonitor();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await monitor.saveData();
    process.exit(0);
});

// Example usage:
// monitor.addModToCategory('Essential Mods', 'https://steamcommunity.com/sharedfiles/filedetails/?id=123456789');
// monitor.listMods();

module.exports = WorkshopModMonitor;