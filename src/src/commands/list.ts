import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');

export const data = new SlashCommandBuilder()
    .setName('list')
    .setDescription('Get a list of all feeds available')

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));

    const feedsList = Object.entries(feeds)
        .map(([name, _data]) => `- ${name}`)
        .join('\n');

    return await interaction.editReply(`Feed available:\n${feedsList}`);
}