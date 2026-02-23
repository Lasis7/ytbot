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

// Path works after this for whatever reason
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

// When the bot receives an interaction. This will happen for every slash command
client.on(Events.InteractionCreate, async (interaction) => {
  // If any other interaction other than slash command is received, the execution will end
  if (!interaction.isChatInputCommand()) {
    return;
  }
  console.log(interaction);
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    return console.error(
      `No command by the name of ${interaction.commandName} was found`,
    );
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.log(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
