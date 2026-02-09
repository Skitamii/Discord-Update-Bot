import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');
const subscriptionsPath = path.join(foldersPath, './../data/subscriptions.json');

export const data = new SlashCommandBuilder()
    .setName('subscribed')
    .setDescription('Get what feed you have subscribed')

export async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));

    const isPM = !interaction.guildId;

    if (isPM) {
        const userID = interaction.user.id;
        const userFeeds = Object.entries(subscriptions)
        .filter(([name, data]) => data.user && data.user.includes(userID))
        .map(([name, data]) => `- ${name}`)
        .join('\n');
        await interaction.editReply(`You are subscribed to:\n${userFeeds}`);
    } else {
        const channelID = interaction.channelId;
        const channelFeeds = Object.entries(subscriptions)
        .filter(([name, data]) => data.channel && data.channel.includes(channelID))
        .map(([name, data]) => `- ${name}`)
        .join('\n');
        await interaction.editReply(`Channel subscribed to:\n${channelFeeds}`);
    }
}