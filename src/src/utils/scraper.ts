import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { addfeed } from './addFeed.js';
import type { jsonFeeds, jsonArticle, jsonArticles, jsonItem, scraperFile } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');

export async function addAllScraper() {
    let scrapersPath = path.join(__dirname, "../scrapers");
    let scrapersFiles: string[]
    try {
        scrapersFiles = fs.readdirSync(scrapersPath).filter((file) => file.endsWith('.js'));
    } catch (error) {
        throw new Error("[addAllScraper()]ERROR: No scraper file found");
    }
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL) as scraperFile;
        const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;

        if (!(scraper.scraper.feedName in feeds)) {
            if ('feedName' in scraper.scraper && 'feedURL' in scraper.scraper && 'getLastArticle' in scraper && 'getAllArticle' in scraper && 'getLastUpdate' in scraper && 'getSpecificUpdate' in scraper) {
                const feedName = scraper.scraper.feedName;
                const feedURL = scraper.scraper.feedURL;
                const feedThumbnail = scraper.scraper.feedThumbnail || '';
                const feedEmbedColor = scraper.scraper.feedEmbedColor || '';

                try {
                    await addfeed(feedName, feedURL, feedThumbnail, feedEmbedColor)
                } catch (error) {
                    console.log(`ERROR: Can't add feed from scraper ${feedName}`)
                }
            } else {
                console.log(`[WARNING] The scraper ${filePath} is missing something, please refer to example.`);
            }
        }
    }
}

export async function getScraperAttribs(feedName: string): Promise<scraperFile | null> {
    let scrapersPath = path.join(__dirname, "../scrapers");
    let scrapersFiles: string[]
    try {
        scrapersFiles = fs.readdirSync(scrapersPath).filter((file) => file.endsWith('.js'));
    } catch (error) {
        return null;
    }
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL) as scraperFile;
        if (scraper.scraper.feedName == feedName) {
            return scraper;
        }
    }
    return null;
}

export async function executeGetLastUpdate(feedName: string): Promise<jsonItem | null> {
    let scrapersPath = path.join(__dirname, "../scrapers");
    let scrapersFiles: string[]
    try {
        scrapersFiles = fs.readdirSync(scrapersPath).filter((file) => file.endsWith('.js'));
    } catch (error) {
        throw new Error("[executeGetLastUpdate()]ERROR: No scraper file found");
    }
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL) as scraperFile;
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getLastUpdate() as jsonItem;
            return result;
        }
    }
    return null;
}

export async function executeGetSpecificUpdate(feedName: string, updateName: String) {
    let scrapersPath = path.join(__dirname, "../scrapers");
    let scrapersFiles: string[]
    try {
        scrapersFiles = fs.readdirSync(scrapersPath).filter((file) => file.endsWith('.js'));
    } catch (error) {
        throw new Error("[executeGetSpecificUpdate()]ERROR: No scraper file found");
    }
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL) as scraperFile;
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getSpecificUpdate(updateName) as jsonItem;
            return result;
        }
    }
    return null;
}

export async function executeGetLastArticle(feedName: string): Promise<jsonArticle | null> {
    let scrapersPath = path.join(__dirname, "../scrapers");
    let scrapersFiles: string[]
    try {
        scrapersFiles = fs.readdirSync(scrapersPath).filter((file) => file.endsWith('.js'));
    } catch (error) {
        throw new Error("[executeGetLastArticle()]ERROR: No scraper file found");
    }
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL) as scraperFile;
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getLastArticle() as jsonArticle;
            return result;
        }
    }
    return null;
}

export async function executeGetAllArticle(feedName: string): Promise<jsonArticles | null> {
    let scrapersPath = path.join(__dirname, "../scrapers");
    let scrapersFiles: string[]
    try {
        scrapersFiles = fs.readdirSync(scrapersPath).filter((file) => file.endsWith('.js'));
    } catch (error) {
        throw new Error("[executeGetAllArticle()]ERROR: No scraper file found");
    }
    for (const scraperFile of scrapersFiles) {
        const filePath = path.join(scrapersPath, scraperFile);
        const fileURL = 'file://' + filePath.replace(/\\/g, '/');

        const scraper = await import(fileURL) as scraperFile;
        if (scraper.scraper.feedName == feedName) {
            const result = await scraper.getAllArticle() as jsonArticles;
            return result;
        }
    }
    return null;
}