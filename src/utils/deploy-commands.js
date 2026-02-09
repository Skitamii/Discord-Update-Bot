import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Pour obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

// Load commands
const commandsPath = path.join(__dirname, "../commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const fileURL = 'file://' + filePath.replace(/\\/g, '/');
  
  const command = await import(fileURL);
  
  // Avec exports nommés, 'data' et 'execute' sont directement dans command
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[SUCCESS] Loaded command: ${command.data.name}`);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Deploy commands
const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID), 
      { body: commands }
    );

    console.log(`Successfully reloaded ${data.length} commands.`);
  } catch (error) {
    console.error(error);
  }
})();