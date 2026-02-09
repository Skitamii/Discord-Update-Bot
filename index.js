import fs from "fs"
import path from "path"
import { Client, Events, GatewayIntentBits, REST, Routes, Collection, MessageFlags } from 'discord.js';
import 'dotenv/config';
import { startFeedChecker } from "./src/utils/feedChecker.js";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

// Load commands
const foldersPath = './src';
const commandsPath = path.join(foldersPath, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`./${filePath}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}
// END Load Commands

// Client ready
client.once(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
  startFeedChecker(client);
});
// END Client ready

// Client interaction (slash commands etc...)
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand() && !interaction.isAutocomplete) return;

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
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
        content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});
// END Client interaction

client.login(process.env.BOT_TOKEN);