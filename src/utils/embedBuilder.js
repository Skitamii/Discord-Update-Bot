import 'dotenv/config';
import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import rssParser from "rss-parser"

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');
const subscriptionsPath = path.join(foldersPath, './../data/subscriptions.json');

export function createUpdateEmbed(feed, feedName, item) {
    const embed = new EmbedBuilder()
        .setColor(feed.embedColor)
        .setAuthor({ name: feedName })
        .setTitle(item.title)
        .setURL(item.link)
        .setDescription(htmlToDiscord(item.contentSnippet)) // use "content" but replace html tags to Discord markdown thing
        .setFooter({
            text: `Update from ${feedName}`
        })
        .setTimestamp(new Date(item.pubDate || item.isoDate || item.date));
    if (item.enclosure != undefined) {
        if (item.enclosure.url != undefined) {
            embed.setImage(item.enclosure.url);
        }
    }
    if (feed.thumbnail) {
        embed.setThumbnail(feed.thumbnail);
    }
    return embed;
}

function htmlToDiscord(content) {
    if (!content) return '';
    const charLimit = 500;

    content.replace(/[\r\n\t]+/g, '\n');

    // 5. Smart truncation to ~500 characters
    if (content.length > charLimit) {
        // Look for a natural breaking point (punctuation + space)
        const cutPoints = ['. ', '! ', '? ', '\n', ', ', '; '];
        let bestCut = charLimit;

        for (const point of cutPoints) {
            const lastIndex = content.lastIndexOf(point, charLimit);
            if (lastIndex > charLimit * 0.8) { // At least 80% of max length
                bestCut = lastIndex + point.length;
                break;
            }
        }

        // If no breaking point found, cut at last space
        if (bestCut === charLimit) {
            const lastSpace = content.lastIndexOf(' ', charLimit);
            bestCut = lastSpace > charLimit * 0.8 ? lastSpace : charLimit;
        }

        content = content.substring(0, bestCut).trim() + '...';
    }

    return content;
}