import { Client, GatewayIntentBits, Collection } from 'discord.js';
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
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Collection of all the commands
client.commands = new Collection();

// Collection of command cooldowns
client.cooldowns = new Collection();

// Collection of bot's audio state
client.audioState = new Collection();

// Collection of information about each song in queue
client.songInfo = new Collection();

// Path works after this for whatever reason
const __dirname = path.resolve();

async function loadCommands() {
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
      const filePath = path.join(commandsPath, file);
      // Import each command. Check if the commands include the required fields
      const command = await import(`file://${filePath}`);
      if ('data' in command.default && 'execute' in command.default) {
        client.commands.set(command.default.data.name, command.default);
      } else {
        console.log(
          `[WARNING] the command at ${filePath} is missing a required "data" or "execute"`,
        );
      }
    }
  }
}

async function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.js'));

  for (const eventFile of eventFiles) {
    const eventFilePath = path.join(eventsPath, eventFile);
    const event = await import(`file://${eventFilePath}`);
    // loginReady contains once-property
    if (event.default.once) {
      // ...args essentially contains all arguments Discord emits when for the event (client)
      client.once(event.default.name, (...args) => {
        event.default.execute(...args);
      });
    } else {
      client.on(event.default.name, (...args) =>
        event.default.execute(...args),
      );
    }
  }
}

loadCommands().then(() =>
  loadEvents().then(() => client.login(process.env.DISCORD_TOKEN)),
);

export default client;
