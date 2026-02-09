import 'dotenv/config';
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import rssParser from "rss-parser"
import { createUpdateEmbed } from './embedBuilder.js';

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');
const subscriptionsPath = path.join(foldersPath, './../data/subscriptions.json');
const parser = new rssParser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

export async function checkRSSFeed(url) {
    return await parser.parseURL(url);
}

export async function checkFeed(clientOrInteraction, feed, feedName) {
    if (feed.disabled) return;

    try {
        const parsedFeed = await checkRSSFeed(feed.url);
        const feedLastState = feed.lastState
        const parsedLastItem = parsedFeed.items[0];
        let feeds=null;
        if (clientOrInteraction.client) {
            feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
            notifySubscribers(clientOrInteraction, feed, parsedLastItem, feedName, feeds);
        }
        if (parsedLastItem.pubDate != feedLastState) {
            // Update available
            feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
            feeds[feedName].lastState = parsedLastItem.pubDate;
            fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
            notifySubscribers(clientOrInteraction, feed, parsedLastItem, feedName, feeds);
        }
    } catch (error) {
        const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
        feeds[feedName].disabled = true;
        fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
        throw new Error(error);
    }
}

async function notifySubscribers(clientOrInteraction, feed, item, feedName, feeds) {
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));
    const embed = createUpdateEmbed(feed, feedName, item);
    const subscription = subscriptions[feedName]

    // Check if interaction or client
    if (clientOrInteraction.client) {
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

        feeds[feedName].lastUpdatedAt = `${date} ${time}`;
        fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));

        const client = clientOrInteraction;
        subscription["user"].forEach(async userID => {
            const user = await client.users.fetch(userID);
            await user.send({ embeds: [embed] });
        });
        subscription["channel"].forEach(async channelID => {
            const channel = await client.channels.fetch(channelID);
            await channel.send({ embeds: [embed] });
        });
    }

}