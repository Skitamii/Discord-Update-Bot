import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { addfeed } from './addFeed.js';
import type { jsonFeeds, jsonArticle, jsonArticles, jsonItem } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');

interface ScraperModule {
    scraper: {
        feedName: string;
        feedURL: string;
        feedThumbnail?: string;
        feedEmbedColor?: string;
    };
    execute: () => Promise<boolean | null>;
    getLastArticle: () => Promise<jsonArticle | null>;
    getLastUpdate: () => Promise<jsonItem | null>;
    getAllArticle: () => Promise<jsonArticles|null>;
    getSpecificUpdate: () => Promise<jsonItem|null>;
}

const scrapersPath = path.join(__dirname, "../scrapers");
const scrapersFiles = fs.readdirSync(scrapersPath).filter((file) => file.endsWith('.js'));

export async function addAllScraper() {
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL);
        const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;

        if (scraper.scraper.feedName != feeds[scraper.scraper.feedName]) {
            if ('feedName' in scraper.scraper && 'feedURL' in scraper.scraper && 'getLastArticle' in scraper && 'getAllArticle' in scraper && 'getLastUpdate' in scraper && 'getSpecificUpdate' in scraper) {
                const feedName = scraper.scraper.feedName;
                const feedURL = scraper.scraper.feedURL;
                const feedThumbnail = scraper.scraper.feedThumbnail || '';
                const feedEmbedColor = scraper.scraper.feedEmbedColor || '';

                try {
                    await addfeed(feedName, feedURL, feedThumbnail, feedEmbedColor, false)
                } catch (error) {
                    console.log(`ERROR: Can't add feed from scraper ${feedName}`)
                }
            } else {
                console.log(`[WARNING] The scraper ${filePath} is missing something, please refer to example.`);
            }
        }
    }
}

export async function executeGetLastUpdate(feedName: string): Promise<jsonItem | null> {
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL);
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getLastUpdate() as jsonItem;
            return result;
        }
    }
    return null;
}

export async function executeGetSpecificUpdate(feedName: string, updateName: String){//A faire
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL);
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getSpecificUpdate(updateName) as jsonItem;
            return result;
        }
    }
    return null;
}

export async function executeGetLastArticle(feedName: string): Promise<jsonArticle | null> {
        for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL);
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getLastArticle() as jsonArticle;
            return result;
        }
    }
    return null;
}

export async function executeGetAllArticle(feedName: string): Promise<jsonArticles | null> {
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL);
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getAllArticle() as jsonArticles;
            return result;
        }
    }
    return null;
}