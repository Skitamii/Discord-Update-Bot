import fs from "fs"
import path from "path"
import { Client, Events, GatewayIntentBits, Collection, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { startFeedChecker } from "./src/utils/feedChecker.js";
import { fileURLToPath, pathToFileURL } from "url";
import { config } from "./src/utils/types.js";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

// Load commands
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "src/commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = await import(pathToFileURL(filePath).href);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Client ready
client.once(Events.ClientReady, readyClient => {
	console.log(`Logged in as ${readyClient.user.tag}!`);
	startFeedChecker(client);
});

// Client interaction (slash commands etc...)
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		if (interaction.isAutocomplete()) {
			if (command.autocomplete) {
				await command.autocomplete(interaction);
			}
		} else {
			await command.execute(interaction);
		}
	} catch (error) {
		console.error(error);
		const inter = interaction as ChatInputCommandInteraction;
		if (inter.replied || inter.deferred) {
			await inter.followUp({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await inter.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

client.login(config.BOT_TOKEN);