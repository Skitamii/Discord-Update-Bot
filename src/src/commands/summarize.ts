import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuInteraction, ButtonInteraction, ModalBuilder, LabelBuilder, TextInputBuilder, ModalSubmitInteraction, TextInputStyle, CheckboxBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { jsonFeeds } from '../utils/types.js';
import { checkRSSFeed } from '../utils/rssParser.js';
import { createUpdateEmbed } from '../utils/embedBuilder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const feedsPath = path.join(__dirname, './../data/feeds.json');

export const data = new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('summarize an update');

export async function execute(interaction: ChatInputCommandInteraction) {
    const apiKey = process.env['LLM_API_KEY'] as string;
    if (!apiKey) throw new Error('LLM_API_KEY not defined');

    const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf-8')) as jsonFeeds;
    const availableFeeds = Object.keys(feeds).filter(feed => !feeds[feed]!.disabled);
    if (availableFeeds.length === 0) {
        return await interaction.reply({
            content: '❌ No feeds available.',
            flags: MessageFlags.Ephemeral,
        });
    }

    // Dropdown feed

    const feedSelect = new StringSelectMenuBuilder()
        .setCustomId('summarize_feed_select')
        .setPlaceholder('Choose a feed...')
        .addOptions(
            availableFeeds.map(_feedName => {
                const feed = feeds[_feedName]!;
                return new StringSelectMenuOptionBuilder()
                    .setLabel(_feedName)
                    .setValue(_feedName)
                    .setDescription(`Last update: ${feed.lastUpdatedAt}`);
            })
        );

    const response = await interaction.reply({
        content: 'Choose a feed:',
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(feedSelect)],
        flags: MessageFlags.Ephemeral,
    });

    // Dropdown specific feed update

    const feedCollector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 120000,
    });

    let selectedItem: { feedName: string; title: string; content: string; url: string } | undefined;
    let selectedUpdateIndex: number | null = null;
    let updateCollector: any = null; // Track the collector to close it

    feedCollector.on('collect', async (feedInteraction: StringSelectMenuInteraction) => {
        if (feedInteraction.customId !== 'summarize_feed_select') return;

        selectedUpdateIndex = null;

        // Close the previous update collector before creating a new one
        if (updateCollector) {
            updateCollector.stop();
        }

        const feedName = feedInteraction.values[0];
        if (!feedName) return;

        const feed = feeds[feedName];
        if (!feed) return;

        await feedInteraction.update({
            content: '⏳ Loading updates...',
            components: [],
        });

        const parsedFeed = await checkRSSFeed(feed.url);
        const items = parsedFeed.items.slice(0, 25); // Max 25 for Discord

        if (items.length === 0) {
            await interaction.editReply({
                content: '❌ No updates found for this feed.',
                components: [],
            });
            return;
        }

        const refreshedfeedSelect = new StringSelectMenuBuilder()
            .setCustomId('summarize_feed_select')
            .setPlaceholder('Choose a feed...')
            .addOptions(
                availableFeeds.map(_feedName => {
                    const feed = feeds[_feedName]!;
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(_feedName)
                        .setValue(_feedName)
                        .setDescription(`Last update: ${feed.lastUpdatedAt}`)
                        .setDefault(_feedName === feedName)
                })
            );

        const updateSelect = new StringSelectMenuBuilder()
            .setCustomId('summarize_update_select')
            .setPlaceholder('Choose an update...')
            .addOptions(
                items.map((item, idx) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel((item.title ?? `Update ${idx + 1}`).slice(0, 100))
                        .setValue(String(idx))
                        .setDescription(new Date(item.pubDate ?? '').toLocaleString())
                        .setDefault(idx === selectedUpdateIndex)
                )
            );

        await interaction.editReply({
            content: `Choose an update from **${feedName}**:`,
            embeds: [],
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(refreshedfeedSelect),
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(updateSelect)
            ],
        });

        // Embed update

        updateCollector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 120000,
        });

        updateCollector.on('collect', async (updateInteraction: StringSelectMenuInteraction) => {
            if (updateInteraction.customId !== 'summarize_update_select') return;

            const index = Number(updateInteraction.values[0]);
            selectedUpdateIndex = index;
            const item = items[index];
            if (!item) return;

            selectedItem = {
                feedName: feedName,
                title: item.title ?? 'Unknown',
                content: item.contentSnippet ?? item.content ?? 'Unknown',
                url: item.link ?? ''
            };

            const embed = createUpdateEmbed(feed, feedName, item);

            const refreshedUpdateSelect = new StringSelectMenuBuilder()
                .setCustomId('summarize_update_select')
                .setPlaceholder('Choose an update...')
                .addOptions(
                    items.map((item, idx) =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel((item.title ?? `Update ${idx + 1}`).slice(0, 100))
                            .setValue(String(idx))
                            .setDescription(new Date(item.pubDate ?? '').toLocaleString())
                            .setDefault(idx === selectedUpdateIndex)
                    )
                );

            const summarizeButton = new ButtonBuilder()
                .setCustomId('summarize_open_modal')
                .setLabel('Summarize')
                .setStyle(ButtonStyle.Primary);

            await updateInteraction.update({
                content: '',
                embeds: [embed],
                components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>()
                        .addComponents(refreshedfeedSelect),
                    new ActionRowBuilder<StringSelectMenuBuilder>()
                        .addComponents(refreshedUpdateSelect),
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(summarizeButton),
                ],
            });
        })
    });

    // Modal

    const buttonCollector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000,
    });

    buttonCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
        if (buttonInteraction.customId !== 'summarize_open_modal') return;

        const modal = new ModalBuilder()
            .setCustomId('summarize_modal')
            .setTitle('Summarize')
            .addLabelComponents(new LabelBuilder()
                .setLabel('Choose your prompt')
                .setTextInputComponent(new TextInputBuilder()
                    .setCustomId('summarize_prompt')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setValue("Summarize this update in key points.")
                    .setMaxLength(250)
                )
            )
            .addLabelComponents(new LabelBuilder()
                .setLabel('Ephemeral ? (message only you)')
                .setCheckboxComponent(new CheckboxBuilder()
                    .setCustomId("summarize_ephemeral_checkbox")
                    .setDefault(true)
                )
            );

        await buttonInteraction.showModal(modal);

        const modalSubmit = await buttonInteraction.awaitModalSubmit({
            time: 300000,
            filter: (i: ModalSubmitInteraction) => i.customId === 'summarize_modal',
        }).catch(() => null);

        if (!modalSubmit || !selectedItem) {
            await interaction.editReply({ content: 'Timed out. Retry later', components: [] }).catch(() => { });
            return;
        }

        const customPrompt = modalSubmit.fields.getTextInputValue('summarize_prompt');
        const isEphemeral = modalSubmit.fields.getCheckbox('summarize_ephemeral_checkbox');

        await modalSubmit.reply({
            content: '⏳ Generating summary...',
            flags: isEphemeral ? MessageFlags.Ephemeral : MessageFlags.SuppressEmbeds,
        });

        const result = await callLLMAPI(selectedItem.content, customPrompt);

        const summarizeMessage = `__${customPrompt}__\n# ${selectedItem.feedName}\n` + (selectedItem.url.startsWith('http') ? `## *[${selectedItem.title}](${selectedItem.url})*` : `## *${selectedItem.title}*`) + `\n\n${result}`;
        await modalSubmit.editReply(summarizeMessage);

        await interaction.editReply({ content: `Summary generated successfully ✅`, components: [] }).catch(() => { });

        feedCollector.stop();
        buttonCollector.stop();
    })

    feedCollector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.editReply({ content: 'Selection timed out. Retry later', components: [] }).catch(() => { });
        }
    });
}

async function callLLMAPI(content: string, customPrompt: string): Promise<string> {
    const apiKey = process.env['LLM_API_KEY'] as string;
    if (!apiKey) throw new Error('LLM_API_KEY not defined');

    const prompt = `MAX 1500 CHARACTERS, ONLY THE ANSWER, NO SUB MESSAGE, NO TITLE, 
    FORMATTED FOR DISCORD MESSAGE (*italics*;**bold**;***bold italics***;__underline__;__*underline italics*__;__**underline bold**__;__***underline bold italics***__;~~Strikethrough~~)
    \n\n----------\n\n${customPrompt}\n\n----------\n\n${content}`;

    const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
        {
            method: 'POST',
            headers: {
                'x-goog-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
            }),
        }
    );

    if (!response.ok) {
        const data = await response.json() as { error?: { message?: string } };
        return `❌ LLM API Error: ${data?.error?.message}`;
    }

    const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '❌ No response from LLM.';
}