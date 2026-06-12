import fs from 'fs';
import path from 'path';
import { checkFeed } from '../utils/rssParser.js';
import type { Client } from 'discord.js';
import { config, type jsonFeed, type jsonFeeds } from './types.js';
import { fileURLToPath } from 'url';
import { addAllScraper } from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');

export async function startFeedChecker(client: Client) {
    const checkInterval = config.CHECK_INTERVAL || 5;
    try { await addAllScraper(); } catch (error) { "[startFeedChecker()]"+console.error((error as Error).message) }
    checkAllFeeds(client);
    setInterval(async () => {
        await checkAllFeeds(client);
    }, checkInterval * 60 * 1000);
}

async function checkAllFeeds(client: Client) {
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;

    for (const [feedName, feed] of Object.entries(feeds)) {
        try {
            await checkFeed(client, feed as jsonFeed, feedName);
        } catch (error) {
            const user = await client.users.fetch(config.ADMIN_ID);
            await user.send(`Error checking feed '${feedName}' NOW DISABLED`);
            console.error(`Error checking feed ${feedName}:`, error);
        }
    }
}