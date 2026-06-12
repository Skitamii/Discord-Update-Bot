import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { config } from '../utils/types.js';
import { addfeed } from '../utils/addFeed.js';

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

    try {
        await addfeed(feedName, url, thumbnail, embedColorInput)
        await interaction.editReply(`✅ Feed **${feedName}** added successfully`);
    } catch (error) {
        await interaction.editReply(`ERROR: ${error}`);
    }

}