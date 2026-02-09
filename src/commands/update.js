import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { checkFeed } from '../utils/rssParser.js';

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');
const subscriptionsPath = path.join(foldersPath, './../data/subscriptions.json');

export const data = new SlashCommandBuilder()
    .setName('update')
    .setDescription('Force feed and get the last update')
    .addStringOption(option =>
        option.setName('feedname')
            .setDescription('feed name to update')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addBooleanOption(option =>
        option.setName('ephemeral')
            .setDescription('true = only visible by you')
    );

export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));

    const choices = Object.keys(feeds)
        .filter(name => name.toLowerCase().includes(focusedValue.toLowerCase()))
        .filter(feed => !feeds[feed].disabled)
        .filter(feedName => {
            const subscription = subscriptions[feedName];

            const isPM = !interaction.guildId;
            if (isPM) {
                const userID = interaction.user.id
                const isUserSubscribed = subscription["user"].includes(userID);
                return isUserSubscribed
            } else {
                const channelID = interaction.channelId;
                const isChannelSubscribed = subscription["channel"].includes(channelID);
                return isChannelSubscribed;
            }
        })
        .slice(0, 25);

    await interaction.respond(
        choices.map(name => ({ name, value: name }))
    );
}

export async function execute(interaction) {
    const ephemeral = interaction.options.getBoolean('ephemeral');
    if (ephemeral == false) { // false because null is false too
        await interaction.deferReply();
    } else {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }

    const feedName = interaction.options.getString('feedname');
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
    const feed = feeds[feedName];

    checkFeed(interaction, feed, feedName)
}