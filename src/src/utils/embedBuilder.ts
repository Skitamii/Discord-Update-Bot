import { EmbedBuilder } from 'discord.js';
import rssParser from "rss-parser";
import type { jsonFeed, jsonItem } from './types.js';

export function createUpdateEmbed(feed: jsonFeed, feedName: string, item: jsonItem) {
    const embed = new EmbedBuilder()
        .setColor(feed.embedColor)
        .setAuthor({ name: feedName })
        .setTitle(item.title || null)
        .setURL(item.link || null)
        .setDescription(htmlToDiscord(item.contentSnippet || "")) // use "content" but replace html tags to Discord markdown thing
        .setFooter({
            text: `Update from ${feedName}`
        })
        .setTimestamp(new Date(item.pubDate || ''));
    if (item.enclosureUrl != undefined) {
        embed.setImage(item.enclosureUrl);
    }
    if (feed.thumbnail) {
        embed.setThumbnail(feed.thumbnail);
    }
    return embed;
}

function htmlToDiscord(content: string) {
    if (!content) return '';
    const charLimit = 500;

    content = content.replace(/[\r\n\t]+/g, '\n');

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