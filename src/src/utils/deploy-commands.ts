import { REST, Routes } from 'discord.js';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { config } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands: object[] = [];

// Load commands
const commandsPath = path.join(__dirname, "../commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const fileURL = 'file://' + filePath.replace(/\\/g, '/');

  const command = await import(fileURL);

  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[SUCCESS] Loaded command: ${command.data.name}`);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Deploy commands
const rest = new REST().setToken(config.BOT_TOKEN!);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} commands.`);

    const data = await rest.put(
      Routes.applicationCommands(config.APPLICATION_ID!),
      { body: commands }
    ) as unknown[];

    console.log(`Successfully reloaded ${data.length} commands.`);
  } catch (error) {
    console.error(error);
  }
})();