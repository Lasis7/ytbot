import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Provide a URL to play'),
  async execute(interaction) {
    const userInVc = interaction.member.voice.channel; // Guildmember in docs
    const botInVc = interaction.guild.members.me.voice.channel; // Guild in docs
    const userVcId = interaction.member.voice.channelId;
    const botVcId = interaction.guild.members.me.voice.channelId;
    if (!userInVc) {
      return await interaction.reply({
        content: 'You need to be inside a voice channel to use this command',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (botInVc && userVcId !== botVcId) {
      return await interaction.reply({
        content:
          'You need to be in the same voice channel as the bot to use this command',
        flags: MessageFlags.Ephemeral,
      });
    }
    return await interaction.reply({
      content: 'working',
      flags: MessageFlags.Ephemeral,
    });
  },
};
