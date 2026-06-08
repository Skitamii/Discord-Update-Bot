import fs from 'fs';
import path from 'path';
import { checkRSSFeed } from '../utils/rssParser.js';
import { validateThumbnailURL, verifyAndSetHEXColor } from '../utils/verificator.js';
import { type jsonFeeds, type jsonSubscriptions } from '../utils/types.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');
const subscriptionsPath = path.join(__dirname, './../data/subscriptions.json');


export async function addfeed(feedName: string, url: string, thumbnail: string, paramEmbedColor: string, isRssFeed: boolean){
    // validate color
    const embedColor = verifyAndSetHEXColor(paramEmbedColor);

    // validate URL
    if(isRssFeed){
        try {
            await checkRSSFeed(url);
        } catch (error) {
            throw new Error(`❌ Invalid feed URL.`);
        }
    }

    // validate thumbnail
    if (thumbnail) {
        const isThumbnailValid = await validateThumbnailURL(thumbnail);
        if (!isThumbnailValid) {
            throw new Error(`❌ Invalid thumbnail URL. Must be HTTPS and point to a valid image (PNG, JPG, GIF, WebP).`);
        }
    }

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;

    if (feeds[feedName]) {
        throw new Error(`❌ Feed with name \`${feedName}\` already exist.`);
    }

    feeds[feedName] = {
        url,
        lastState: "",
        lastUpdatedAt: "",
        disabled: false,
        thumbnail: thumbnail,
        embedColor: embedColor,
        isRssFeed: isRssFeed
    };

    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8')) as jsonSubscriptions;

    subscriptions[feedName] = {
        user: [],
        channel: []
    };

    fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
    fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions, null, 2));

}