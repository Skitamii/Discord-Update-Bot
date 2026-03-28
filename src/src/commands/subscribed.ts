import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { jsonSubscription } from '../utils/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');
const subscriptionsPath = path.join(__dirname, './../data/subscriptions.json');

export const data = new SlashCommandBuilder()
    .setName('subscribed')
    .setDescription('Get what feed you have subscribed')

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
    const subscriptions: Record<string, jsonSubscription> = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));

    const isPM = !interaction.guildId;

    if (isPM) {
        const userID = interaction.user.id;
        const userFeeds = Object.entries(subscriptions)
            .filter(([_name, data]) => data && data.user && data.user.includes(userID))
            .map(([name, _data]) => `- ${name}`)
            .join('\n');
        await interaction.editReply(`You are subscribed to:\n${userFeeds}`);
    } else {
        const channelID = interaction.channelId;
        const channelFeeds = Object.entries(subscriptions)
            .filter(([_name, data]) => data && data.channel && data.channel.includes(channelID))
            .map(([name, _data]) => `- ${name}`)
            .join('\n');
        await interaction.editReply(`Channel subscribed to:\n${channelFeeds}`);
    }
}