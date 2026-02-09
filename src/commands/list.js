import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');

export const data = new SlashCommandBuilder()
    .setName('list')
    .setDescription('Get a list of all feeds available')

export async function execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));

    const feedsList = Object.entries(feeds)
        .map(([name, data]) => `- ${name}`)
        .join('\n');

    return await interaction.editReply(`Feed available:\n${feedsList}`);
}