import path from 'node:path';
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import 'dotenv/config';

export default {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('reloads a command')
    // add options to command
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('command to reload')
        .setRequired(true),
    ),
  async execute(interaction) {
    // This command can be only used by the owner
    if (interaction.user.id === process.env.OWNER_ID) {
      const commandName = interaction.options
        .getString('command', true)
        .toLowerCase();
      const command = interaction.client.commands.get(commandName);

      if (!command) {
        return await interaction.reply({
          content: `Command \`${commandName}\` not found`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Path works after this for whatever reason
      const __dirname = path.resolve();

      // Path to the specific command
      const commandpath = `${__dirname}\\commands\\utility\\${commandName}.js`;

      try {
        // Each import with different timestamp is treated as a seperate module
        const updatedCommand = await import(
          `file://${commandpath}?t=${Date.now()}`
        );

        if (
          'data' in updatedCommand.default &&
          'execute' in updatedCommand.default
        ) {
          // Old command is replaced with an updated one
          interaction.client.commands.set(
            updatedCommand.default.data.name,
            updatedCommand.default,
          );
        } else {
          console.log(
            `[WARNING] the command at ${commandpath} is missing a required "data" or "execute"`,
          );
        }

        return await interaction.reply({
          content: `Command ${commandName} updated`,
        });
      } catch (error) {
        console.log(error);
        await interaction.reply({
          content: `There was an error reloading command ${commandName}: ${error.message}`,
        });
      }
    } else {
      // If anyone else other than the owner tries to use the command
      return await interaction.reply({
        content: 'You are not allowed to use this command',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
