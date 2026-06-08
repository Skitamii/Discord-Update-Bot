import 'dotenv/config';
import type { AutocompleteInteraction, ChatInputCommandInteraction, Collection, ColorResolvable, SlashCommandBuilder, UserResolvable } from "discord.js";

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command>;
    }
}

export interface jsonFeed {
    url: string;
    lastState: string;
    lastUpdatedAt: string;
    disabled: boolean;
    thumbnail: string;
    embedColor: ColorResolvable;
    isRssFeed: boolean
}

export interface jsonFeeds {
    [feedName: string]: jsonFeed;
}

export interface jsonSubscription {
    user: string[];
    channel: string[];
}

export interface jsonSubscriptions {
    [feedName: string]: jsonSubscription;
}

export type jsonArticles = jsonArticle[];

export interface jsonArticle {
    title: string,
    url: string,
    pubDate: string,
    lastState: string
}

export type jsonItems = jsonItem[];

export interface jsonItem {
    content: string,
    contentSnippet: string,
    link: string,
    pubDate: string,
    title: string,
    enclosureUrl: string | undefined,
    lastState: string
}

export const config = {
    BOT_TOKEN: process.env['BOT_TOKEN'] as string,
    APPLICATION_ID: process.env['APPLICATION_ID'] as string,
    ADMIN_ID: process.env['ADMIN_ID'] as UserResolvable,
    CHECK_INTERVAL: Number(process.env['CHECK_INTERVAL']) || 5,
};