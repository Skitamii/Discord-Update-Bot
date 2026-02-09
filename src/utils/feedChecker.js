import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { checkFeed } from '../utils/rssParser.js';

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');

export function startFeedChecker(client) {
    const checkInterval = process.env.CHECK_INTERVAL || 5;
    checkAllFeeds(client);
    setInterval(async () => {
        await checkAllFeeds(client);
    }, checkInterval * 60 * 1000);
}

async function checkAllFeeds(client) {
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));

    await Object.entries(feeds).forEach(async ([feedName, feed]) => {
        try {
            await checkFeed(client, feed, feedName);
        } catch (error) {
            const user = await client.users.fetch(userID);
            await user.send(`Error checking feed '${feedName}' NOW DISABLED`);
            console.error(`Error checking feed ${feedName}:`, error);
        }
    });
}