import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

const commands = [];

// Path works after this for whatever reason
const __dirname = path.resolve();

// Create a path to the commands folder
const foldersPath = path.join(__dirname, 'commands');
// Read the contents of the commands folder. Returns a string array containing all folders
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Form a path to each folder
  const commandsPath = path.join(foldersPath, folder);
  // Return a string array containing only the command files
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    // File path for each command file
    const filePath = path.join(commandsPath, file);
    // Import each command. Check if the commands include the required fields
    const command = await import(`file://${filePath}`);
    if ('data' in command.default && 'execute' in command.default) {
      // Command data needs to be in JSON
      commands.push(command.default.data.toJSON());
    } else {
      console.log(
        `[WARNING] the command at ${filePath} is missing a required "data" or "execute"`,
      );
    }
  }
}

// Prepare the rest module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands`,
    );

    // Refresh commands with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands },
    );
    console.log(
      `Successfully reloaded ${data.length} application (/) commands`,
    );
  } catch (err) {
    console.error(err);
  }
})();
