import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');
const subscriptionsPath = path.join(foldersPath, './../data/subscriptions.json');

export const data = new SlashCommandBuilder()
    .setName('subscribe')
    .setDescription('Subscribe to a feed')
    .addStringOption(option =>
        option.setName('feedname')
            .setDescription('feed name to subscribe')
            .setRequired(true)
            .setAutocomplete(true)
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
                return !isUserSubscribed
            } else {
                const channelID = interaction.channelId;
                const isChannelSubscribed = subscription["channel"].includes(channelID);
                return !isChannelSubscribed;
            }
        })
        .slice(0, 25);

    await interaction.respond(
        choices.map(name => ({ name, value: name }))
    );
}

export async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Edit the message flag ?

    const feedName = interaction.options.getString('feedname');

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));

    if (!feeds[feedName]) {
        return await interaction.editReply(`❌ Feed with name \`${feedName}\` doesn't exist.`);
    }

    const feed = feeds[feedName];

    // Check if it's private message or guild message
    const isPM = !interaction.guildId;

    if (isPM) {
        const userID = interaction.user.id

        if (subscriptions[feedName]["user"].includes(userID)) {
            return await interaction.editReply(`❌ You are already subscribe to **${feedName}** here.`);
        }

        subscriptions[feedName]["user"].push(userID);
        fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions, null, 2));

        await interaction.editReply(`✅ You are now subscribe to **${feedName}** ! You are going to receive update in private message.`);

    } else {
        const channelID = interaction.channelId;

        if (subscriptions[feedName]["channel"].includes(channelID)) {
            return await interaction.editReply(`❌ This channel is not subscribe to **${feedName}** here.`);
        }

        subscriptions[feedName]["channel"].push(channelID);
        fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions, null, 2));

        await interaction.editReply(`✅ Channel now subscribe to **${feedName}** ! You are going to receive update in this channel.`);

    }
}