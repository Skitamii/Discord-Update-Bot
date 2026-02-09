import 'dotenv/config';
import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

const foldersPath = './src';
const feedsPath = path.join(foldersPath, './../data/feeds.json');
const subscriptionsPath = path.join(foldersPath, './../data/subscriptions.json');

export const data = new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete a feed (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('feedname')
            .setDescription('Feed name to delete')
            .setRequired(true)
            .setAutocomplete(true)
    );

export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));

    const choices = Object.keys(feeds)
        .filter(name => name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);

    await interaction.respond(
        choices.map(name => ({ name, value: name }))
    );
}

export async function execute(interaction) {
    if (interaction.user.id !== process.env.ADMIN_ID) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const feedName = interaction.options.getString('feedname');
    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'));
    const subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, 'utf-8'));

    if (!feeds[feedName]) {
        return await interaction.editReply(`❌ No feed with name '${feedName}'.`);
    }

    delete feeds[feedName];
    delete subscriptions[feedName];
    fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2));
    fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions, null, 2));

    await interaction.editReply(`✅ Feed **${feedName}** deleted successfully.`);
}