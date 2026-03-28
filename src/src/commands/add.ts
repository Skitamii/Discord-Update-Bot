import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { checkRSSFeed } from '../utils/rssParser.js';
import { validateThumbnailURL, verifyAndSetHEXColor } from '../utils/verificator.js';
import { config } from '../utils/types.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');
const subscriptionsPath = path.join(__dirname, './../data/subscriptions.json');

export const data = new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a feed (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('feedname')
            .setDescription('Feed name (used as display name)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('url')
            .setDescription('URL of the feed')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('thumbnail')
            .setDescription(`URL for thumbnail of the feed (display top right)`)
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('embedcolor')
            .setDescription('Color of the Embed (default random)')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== config.ADMIN_ID) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const feedName = (interaction.options.getString('feedname', true));
    const url = (interaction.options.getString('url', true)).toLowerCase();
    const thumbnail = (interaction.options.getString('thumbnail') || '').toLowerCase(); // Need to verify if it's image
    const embedColorInput = (interaction.options.getString('embedcolor') || '').toUpperCase();

    // validate color
    let embedColor = verifyAndSetHEXColor(embedColorInput);

    // validate URL
    try {
        await checkRSSFeed(url);
    } catch (error) {
        return await interaction.editReply(`❌ Invalid feed URL.`);
    }

    // validate thumbnail
    if (thumbnail) {
        const isThumbnailValid = await validateThumbnailURL(thumbnail);
        if (!isThumbnailValid) {
            return await interaction.editReply(`❌ Invalid thumbnail URL. Must be HTTPS and point to a valid image (PNG, JPG, GIF, WebP).`);
        }
    }

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));

    if (feeds[feedName]) {
        return await interaction.editReply(`❌ Feed with name \`${feedName}\` already exist.`);
    }

    feeds[feedName] = {
        url,
        lastState: null,
        lastUpdatedAt: null, // to be used while doing scrapers
        disabled: false,
        thumbnail: thumbnail || null, // to be checked add.js and edit.js
        embedColor: embedColor || null,
    };

    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));

    subscriptions[feedName] = {
        user: [],
        channel: []
    };

    fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
    fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions, null, 2));

    await interaction.editReply(`✅ Feed **${feedName}** added successfully`);
}