import {
  Client,
  Events,
  GatewayIntentBits,
  Collection,
  MessageFlags,
} from 'discord.js';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

// Client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
});

// Run when client is ready

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.commands = new Collection();

const __dirname = path.resolve();

// Create a path to the commands folder
const folderPath = path.join(__dirname, 'commands');
// Read the contents of the commands folder. Returns a string array containing all folders
const commandFolders = fs.readdirSync(folderPath);

for (const folder of commandFolders) {
  // Form a path to each folder
  const commandsPath = path.join(folderPath, folder);
  // Return a string array containing only the command files
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    // File path for each command file
    const filepath = path.join(commandsPath, file);
    // Import each command. Check if the commands include the required fields
    const command = await import(`file://${filepath}`);
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
    } else {
      console.log(
        `[WARNING] the command at ${filepath} is missing a required "data" or "execute"`,
      );
    }
  }
}

client.login(process.env.DISCORD_TOKEN);
