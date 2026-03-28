import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { checkRSSFeed } from '../utils/rssParser.js';
import { validateThumbnailURL, verifyAndSetHEXColor } from '../utils/verificator.js';
import { config, type jsonFeeds, type jsonSubscriptions } from '../utils/types.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');
const subscriptionsPath = path.join(__dirname, './../data/subscriptions.json');

export const data = new SlashCommandBuilder()
    .setName('edit')
    .setDescription('Edit a feed (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('feedname')
            .setDescription('Feed name (used as display name)')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addBooleanOption(option =>
        option.setName('disabled')
            .setDescription('Enable or disable the feed')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('newfeedname')
            .setDescription('New feed name (used as display name)')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('url')
            .setDescription('URL of the feed')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('thumbnail')
            .setDescription(`URL for thumbnail of the feed (display top right)`)
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('embedcolor')
            .setDescription('Color of the Embed without # (default random)')
            .setRequired(false)
    );

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;

    const choices = Object.keys(feeds)
        .filter(name => name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);

    await interaction.respond(
        choices.map(name => ({ name, value: name }))
    );
}

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== config.ADMIN_ID) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const feedName = interaction.options.getString('feedname', true);
    const newFeedName = interaction.options.getString('newfeedname');
    const isDisabled = interaction.options.getBoolean('disabled');
    const url = (interaction.options.getString('url') || '').toLowerCase();
    const thumbnail = (interaction.options.getString('thumbnail') || '').toLowerCase();
    let embedColor = (interaction.options.getString('embedcolor') || '').toUpperCase();

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;

    if (!feeds[feedName]) {
        return await interaction.editReply(`❌ No feed with name '${feedName}'.`);
    }

    if (newFeedName && feeds[newFeedName]) {
        return await interaction.editReply(`❌ Feed with name '${newFeedName}' already exist.`);
    }

    const edits = [];
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8')) as jsonSubscriptions;

    // apply edits
    if (newFeedName) {

        feeds[newFeedName] = feeds[feedName];
        delete feeds[feedName];

        subscriptions[newFeedName] = subscriptions[feedName]!;
        delete subscriptions[feedName];

        edits.push(`Name: ${feedName} → ${newFeedName}`);
    }

    const currentFeedName = newFeedName || feedName;
    if (isDisabled) {
        feeds[currentFeedName]!.disabled = isDisabled;
        edits.push(`State updated to ${isDisabled}`);
    } else if (isDisabled == false) {
        feeds[currentFeedName]!.disabled = isDisabled;
        edits.push(`State updated to ${isDisabled}`);
    }
    if (url) {
        try {
            await checkRSSFeed(url);
        } catch (error) {
            return await interaction.editReply(`❌ Invalid feed URL.`);
        }
        feeds[currentFeedName]!.url = url;
        edits.push(`URL: ${url}`);
    }
    if (thumbnail) {
        // validate thumbnail here
        const isThumbnailValid = await validateThumbnailURL(thumbnail);
        if (!isThumbnailValid) {
            return await interaction.editReply(`❌ Invalid thumbnail URL. Must be HTTPS and point to a valid image (PNG, JPG, GIF, WebP).`);
        }
        feeds[currentFeedName]!.thumbnail = thumbnail;
        edits.push('Thumbnail updated');
    }
    if (embedColor) {
        feeds[currentFeedName]!.embedColor = verifyAndSetHEXColor(embedColor);
        edits.push(`Embed color: ${feeds[currentFeedName]!.embedColor}`);
    }

    if (edits.length === 0) {
        return await interaction.editReply('❌ No edits specified.');
    }

    fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
    fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions, null, 2));

    await interaction.editReply(`✅ Feed **${feedName}** edited with success !\n\n**Edits:**\n${edits.map(u => `• ${u}`).join('\n')}`);
}