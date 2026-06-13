import { EmbedBuilder, type ColorResolvable } from 'discord.js';
import type { jsonFeed, jsonItem } from './types.js';

export function createUpdateEmbed(feed: jsonFeed, feedName: string, item: jsonItem) {
    const embed = embedBuilder(feedName, item.title, item.link, htmlToDiscord(item.contentSnippet || "", 500), item.pubDate, feed.embedColor, item.enclosureUrl, feed.thumbnail)
    return embed;
}

export function embedBuilder(feedName: string, title: string, url: string, content: string, pubDate: number, color: ColorResolvable = "#FFFFFF", enclosureUrl: string | null = null, thumbnail: string | null = null): EmbedBuilder {
    // const parts = pubDate.trim().split(" ");
    // const [day, month, year] = parts?.[0]?.split("/") ?? [];
    // const timePart = parts?.[1] ?? "00:00:00";
    // const timestamp = Date.parse(`${year}-${month}-${day}T${timePart}`);

    const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: feedName.slice(0, 200) })
        .setTitle(title.slice(0, 200) || null)
        .setURL(url || null)
        .setDescription(htmlToDiscord(content, 3000)||'')
        .setFooter({
            text: `Update from ${feedName.slice(0, 200)}`
        })
        .setTimestamp(pubDate);
    if (enclosureUrl) {
        embed.setImage(enclosureUrl);
    }
    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }
    return embed;
}

function htmlToDiscord(content: string, charLimit: number) {
    if (!content) return '';

    content = content.replace(/[\r\n\t]+/g, '\n');

    if (content.length > charLimit) {
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