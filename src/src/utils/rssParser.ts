import { Client, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import fs from 'fs';
import path from 'path';
import rssParser, { type Item } from "rss-parser"
import { createUpdateEmbed } from './embedBuilder.js';
import type { jsonFeed, jsonFeeds, jsonSubscription, jsonSubscriptions } from './types.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');
const subscriptionsPath = path.join(__dirname, './../data/subscriptions.json');
const parser = new rssParser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

export async function checkRSSFeed(url: string) {
    return await parser.parseURL(url);
}

export async function checkFeed(clientOrInteraction: Client | ChatInputCommandInteraction, feed: jsonFeed, feedName: string) {
    if (feed.disabled) return;

    try {
        const parsedFeed = await checkRSSFeed(feed.url);
        const parsedLastItem = parsedFeed.items[0];
        if (!parsedLastItem) return;
        if (clientOrInteraction instanceof ChatInputCommandInteraction) {
            let feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
            await notifySubscribers(clientOrInteraction, feed, parsedLastItem, feedName, feeds);
            return;
        }
        if (parsedLastItem.pubDate != feed.lastState) {
            // Update available
            let feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
            feeds[feedName].lastState = parsedLastItem.pubDate;
            fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
            await notifySubscribers(clientOrInteraction, feed, parsedLastItem, feedName, feeds);
        }
    } catch (error) {
        const errorCode = (error as Error)?.message;
        const isTemporaryError = 
            errorCode === 'ECONNRESET' ||
            errorCode === 'ENOTFOUND' ||
            errorCode === 'ETIMEDOUT' ||
            error instanceof Error && (
                error.message.includes('TLS') ||
                error.message.includes('socket disconnected')
            );

        if (isTemporaryError) {
            console.log(`[${feedName}] temp network error: ${error}`);
            return;
        }

        const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;
        feeds[feedName]!.disabled = true;
        fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
        throw new Error(error instanceof Error ? `ERROR: ${error.message}` : `ERROR: ${String(error)}`);
    }
}

async function notifySubscribers(clientOrInteraction: Client | ChatInputCommandInteraction, feed: jsonFeed, item: Item, feedName: string, feeds: jsonFeeds) {
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8')) as jsonSubscriptions;
    const embed = createUpdateEmbed(feed, feedName, item);
    const subscription = subscriptions[feedName] as jsonSubscription;

    // Check if interaction or client
    if (clientOrInteraction instanceof ChatInputCommandInteraction) {
        const interaction = clientOrInteraction;
        await interaction.editReply({ embeds: [embed] });
    } else {
        const dateNow = new Date();

        const date = dateNow.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const time = dateNow.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        if (feeds[feedName]) {
            feeds[feedName].lastUpdatedAt = `${date} ${time}`;
            fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
        }

        const client = clientOrInteraction;
        for (const userID of subscription["user"]) {
            const user = await client.users.fetch(userID);
            await user.send({ embeds: [embed] });
        }
        for (const channelID of subscription["channel"]) {
            const channel = await client.channels.fetch(channelID);
            if (channel && channel.isTextBased() && channel instanceof TextChannel) {
                await channel.send({ embeds: [embed] });
            }
        }
    }

}