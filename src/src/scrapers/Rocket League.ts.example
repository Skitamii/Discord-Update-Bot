import { chromium } from 'patchright';
import type { jsonArticle, jsonArticles as jsonArticles, jsonItem, jsonItems } from "../utils/types.js";

export const scraper = {
    feedName: "Rocket League", // *mandatory
    feedURL: 'https://www.rocketleague.com/news/tag/patch-notes', // *mandatory
    feedThumbnail: '', // *optional
    feedEmbedColor: '' // *optional
}

export async function getLastArticle(): Promise<jsonArticle | null> {
    const browser = await chromium.launch();

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    });
    await page.goto(scraper.feedURL, { waitUntil: 'networkidle' });

    const articles = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        return [...doc.querySelectorAll('._16xen4o2')].map((el: any) => ({
            date: el.querySelector('span > span')?.textContent?.trim(),
            title: el.querySelector('a')?.textContent?.trim(),
            url: el.querySelector('a')?.getAttribute('href'),
        }));
    });

    if (!articles.length) {
        console.error('[RL] Article grid not found');
        return null;
    }

    const firstArticle = articles[0];
    const firstArticleUrl = new URL(firstArticle?.url!, scraper.feedURL).toString() || scraper.feedURL;

    const jsonScrapedArticle: jsonArticle = {
        title: firstArticle?.title || scraper.feedName,
        url: firstArticleUrl,
        lastState: firstArticleUrl,
        pubDate: new Date(firstArticle?.date).toLocaleString() || new Date(Date.now()).toLocaleString()
    };

    await browser.close();
    return jsonScrapedArticle;
}

export async function getAllArticle(): Promise<jsonArticles | null> {
    const browser = await chromium.launch();

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    });
    await page.goto(scraper.feedURL, { waitUntil: 'networkidle' });

    const articles = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        return [...doc.querySelectorAll('._16xen4o2')].map((el: any) => ({
            date: el.querySelector('span > span')?.textContent?.trim(),
            title: el.querySelector('a')?.textContent?.trim(),
            url: el.querySelector('a')?.getAttribute('href'),
        }));
    });

    if (!articles.length) {
        console.error('[RL] Article grid not found');
        return null;
    }


    const articleList: jsonArticles = [];

    articles.forEach(element => {
        const articleUrl = new URL(element?.url!, scraper.feedURL).toString() || scraper.feedURL;
        const jsonArticle: jsonArticle = {
            title: element?.title || scraper.feedName,
            url: articleUrl,
            lastState: articleUrl,
            pubDate: new Date(element?.date).toLocaleString() || new Date(Date.now()).toLocaleString()
        };
        articleList.push(jsonArticle)
    });

    await browser.close();
    return articleList;
}

export async function getLastUpdate(): Promise<jsonItem | null> {
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-position=-10000,-10000',
        ]
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    });
    await page.goto(scraper.feedURL, { waitUntil: 'networkidle' });

    const articles = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        return [...doc.querySelectorAll('._16xen4o2')].map((el: any) => ({
            date: el.querySelector('span > span')?.textContent?.trim(),
            title: el.querySelector('a')?.textContent?.trim(),
            url: el.querySelector('a')?.getAttribute('href'),
        }));
    });

    if (!articles.length) {
        console.error('[RL] Article grid not found');
        return null;
    }

    const firstArticle = articles[0];
    const firstArticleUrl = new URL(firstArticle?.url!, scraper.feedURL).toString() || scraper.feedURL;

    await page.goto(firstArticleUrl, { waitUntil: 'networkidle' });

    const item = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        const el = doc.querySelector('article');
        if (!el) return null;
        return {
            content: el.outerHTML,
            contentSnippet: el.querySelector('div.lyd9ut0._1q56ocg0').textContent?.trim(),
            enclosureUrl: el.querySelector('img')?.getAttribute('src'),
        };
    });

    const jsonItem: jsonItem = {
        content: item?.content,
        contentSnippet: item?.contentSnippet,
        link: firstArticleUrl,
        pubDate: new Date(firstArticle?.date).toLocaleString() || new Date(Date.now()).toLocaleString(),
        title: firstArticle?.title || scraper.feedName,
        enclosureUrl: item?.enclosureUrl || '',
        lastState: firstArticleUrl
    }

    await browser.close();
    return jsonItem;
}

export async function getSpecificUpdate(updateName: String): Promise<jsonItem | null> { // A faire
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-position=-10000,-10000',
        ]
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    });
    await page.goto(scraper.feedURL, { waitUntil: 'networkidle' });

    const articles = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        return [...doc.querySelectorAll('._16xen4o2')].map((el: any) => ({
            date: el.querySelector('span > span')?.textContent?.trim(),
            title: el.querySelector('a')?.textContent?.trim(),
            url: el.querySelector('a')?.getAttribute('href'),
        }));
    });

    if (!articles.length) {
        console.error('[RL] Article grid not found');
        return null;
    }

    const firstArticle = articles.find(article => article.title === updateName);
    const firstArticleUrl = new URL(firstArticle?.url!, scraper.feedURL).toString() || scraper.feedURL;

    await page.goto(firstArticleUrl, { waitUntil: 'networkidle' });

    const item = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        const el = doc.querySelector('article');
        if (!el) return null;
        return {
            content: el.outerHTML,
            contentSnippet: el.querySelector('div.lyd9ut0._1q56ocg0').textContent?.trim(),
            enclosureUrl: el.querySelector('img')?.getAttribute('src'),
        };
    });

    const jsonItem: jsonItem = {
        content: item?.content,
        contentSnippet: item?.contentSnippet,
        link: firstArticleUrl,
        pubDate: new Date(firstArticle?.date).toLocaleString() || new Date(Date.now()).toLocaleString(),
        title: firstArticle?.title || scraper.feedName,
        enclosureUrl: item?.enclosureUrl || '',
        lastState: firstArticleUrl
    }

    await browser.close();
    return jsonItem;
}