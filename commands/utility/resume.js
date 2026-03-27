import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('resume the paused song'),
  async execute(interaction) {
    const textChannel = interaction.channel;
    const userInVc = interaction.member.voice.channel; // Guildmember in docs
    const botInVc = interaction.guild.members.me.voice.channel; // Guild in docs

    if (!userInVc) {
      return await interaction.reply({
        content: 'You need to be inside a voice channel to use this command',
        flags: MessageFlags.Ephemeral,
      });
    }

    const connection = getVoiceConnection(interaction.member.voice.guild.id);

    // If the bot is in VC but the in a different channel than the user, or there is no player active at the moment
    if (!connection || (botInVc && userInVc.id !== botInVc.id)) {
      return await interaction.reply({
        content:
          'You need to be in the same voice channel as the bot to use this command',
        flags: MessageFlags.Ephemeral,
      });
    }

    connection.state.subscription.player.unpause();
    textChannel.send('Resuming');
  },
};
