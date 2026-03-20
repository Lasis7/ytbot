import { Collection, Events, MessageFlags } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  // When the bot receives an interaction. This will happen for every slash command
  async execute(interaction) {
    // If any other interaction other than slash command is received, the execution will end
    if (!interaction.isChatInputCommand()) {
      return;
    }
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      return console.error(
        `No command by the name of ${interaction.commandName} was found`,
      );
    }

    // cooldowns initialized in bot.js
    const { cooldowns } = interaction.client;

    // if no registered previous uses
    if (!cooldowns.has(interaction.commandName)) {
      cooldowns.set(interaction.commandName, new Collection());
    }

    const now = Date.now(); // Current time in milliseconds
    const timestamps = cooldowns.get(interaction.commandName); //Get cooldown timestamps for the command
    const defaultCooldownTime = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldownTime) * 1000;

    // Check if the user has used the command recently
    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount; // Time when the cooldown ends
      // if the cooldown hasn't ended yet
      if (expirationTime > now) {
        const coolDownRemaining = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `Please wait, you can use the command again <t:${coolDownRemaining}:R>.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (err) {
      console.log(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command',
          flags: MessageFlags.Ephemeral, // error message not visible on chat
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
