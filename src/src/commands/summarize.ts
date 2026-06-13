import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuInteraction, ButtonInteraction, ModalBuilder, LabelBuilder, TextInputBuilder, ModalSubmitInteraction, TextInputStyle, CheckboxBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { jsonArticle, jsonArticles, jsonFeeds, jsonItem } from '../utils/types.js';
import { checkRSSFeed } from '../utils/rssParser.js';
import { createUpdateEmbed, embedBuilder } from '../utils/embedBuilder.js';
import { executeGetAllArticle, executeGetSpecificUpdate } from '../utils/scraper.js';

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
            availableFeeds.slice(0, 25).map(_feedName => {
                const feed = feeds[_feedName]!;
                return new StringSelectMenuOptionBuilder()
                    .setLabel(_feedName)
                    .setValue(_feedName)
                    .setDescription(`Last update: ${new Date(feed.lastUpdatedAt).toLocaleString()}`);
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

    let selectedItem: { feedName: string; title: string; content: string; url: string; pubDate: number; enclosureUrl: string; thumbnail: string } | undefined;
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

        let jsonArticles: jsonArticles = [];
        if (feed.isRssFeed) {
            const parsedFeed = await checkRSSFeed(feed.url);
            const items = parsedFeed.items//.slice(0, 25); // Max 25 for Discord
            for (let index = 0; index < items.length; index++) {
                const element = items[index];
                const jsonArticle: jsonArticle = {
                    title: element?.title || '',
                    url: element?.link || '',
                    pubDate: new Date(element?.pubDate || '').getTime(),
                    lastState: '',
                }
                jsonArticles.push(jsonArticle);
                if (index == 25) {
                    break;
                }
            }
        } else {
            try {
                jsonArticles = await executeGetAllArticle(feedName) || [];
            } catch (error) {
                throw new Error("[cmd.summarize.execute.feedInteraction]")
            }
        }

        if (jsonArticles.length === 0) {
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
                availableFeeds.slice(0, 25).map(_feedName => {
                    const feed = feeds[_feedName]!;
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(_feedName)
                        .setValue(_feedName)
                        .setDescription(`Last update: ${new Date(feed.lastUpdatedAt).toLocaleString()}`)
                        .setDefault(_feedName === feedName)
                })
            );

        const updateSelect = new StringSelectMenuBuilder()
            .setCustomId('summarize_update_select')
            .setPlaceholder('Choose an update...')
            .addOptions(
                jsonArticles.slice(0, 25).map((item, idx) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel((item.title ?? `Update ${idx + 1}`).slice(0, 100))
                        .setValue(String(idx))
                        .setDescription(new Date(item.pubDate).toLocaleString())
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

            await updateInteraction.update({
                content: '⏳ Loading update...',
                embeds: [],
                components: [],
            })
            const index = Number(updateInteraction.values[0]);
            selectedUpdateIndex = index;
            const jsonArticleTitle = jsonArticles[index]?.title;
            if (!jsonArticleTitle) {
                return await updateInteraction.update("Error: Article title not found")
            }
            let jsonItem: jsonItem | null;
            if (feed.isRssFeed) {
                const rssFeeds = await checkRSSFeed(feed.url);
                const rssFeed = rssFeeds.items[index];
                jsonItem = {
                    content: rssFeed?.content || '',
                    contentSnippet: rssFeed?.contentSnippet || '',
                    link: rssFeed?.link || '',
                    pubDate: new Date(rssFeed?.pubDate || '').getTime(),
                    title: rssFeed?.title || '',
                    enclosureUrl: rssFeed?.enclosure?.url || undefined,
                    lastState: rssFeed?.pubDate || ''
                }
            } else {
                try {
                    jsonItem = await executeGetSpecificUpdate(feedName, jsonArticleTitle);
                } catch (error) {
                    throw new Error("[cmd.summarize.execute.updateInteraction]")
                }
            }
            if (!jsonItem) return;

            selectedItem = {
                feedName: feedName,
                title: jsonItem.title ?? 'Unknown',
                content: jsonItem.contentSnippet ?? jsonItem.content ?? 'Unknown',
                url: jsonItem.link ?? '',
                pubDate: jsonItem.pubDate,
                enclosureUrl: jsonItem.enclosureUrl || '',
                thumbnail: feed.thumbnail
            };

            const embed = createUpdateEmbed(feed, feedName, jsonItem);

            const refreshedUpdateSelect = new StringSelectMenuBuilder()
                .setCustomId('summarize_update_select')
                .setPlaceholder('Choose an update...')
                .addOptions(
                    jsonArticles.slice(0, 25).map((item, idx) =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel((item.title ?? `Update ${idx + 1}`).slice(0, 100))
                            .setValue(String(idx))
                            .setDescription(new Date(item.pubDate).toLocaleString())
                            .setDefault(idx === selectedUpdateIndex)
                    )
                );

            const summarizeButton = new ButtonBuilder()
                .setCustomId('summarize_open_modal')
                .setLabel('Summarize')
                .setStyle(ButtonStyle.Primary);

            await updateInteraction.editReply({
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
        const summarizeMessage = `## ${interaction.user}:__${customPrompt}__\n\n${result}`;
        const embed = embedBuilder(selectedItem.feedName, selectedItem.title, selectedItem.url, summarizeMessage, selectedItem.pubDate, undefined, selectedItem.enclosureUrl, selectedItem.thumbnail)

        await modalSubmit.editReply({
            content: '',
            embeds: [embed]
        });
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

    const prompt = `MAX 3000 CHARACTERS, ONLY THE ANSWER, NO SUB MESSAGE, NO TITLE, 
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