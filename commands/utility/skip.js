import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  async execute(interaction) {
    const { audioState } = interaction.client; // Collection holding info on various things related to audio
    let guildAudioState = audioState.get(process.env.GUILD_ID);
    if (!guildAudioState) {
      audioState.set(process.env.GUILD_ID, {
        connection: null,
        audioPlayer: null,
        subscription: null,
        currentSong: null,
        stateHandlerInit: false,
        ytdlp: null,
        ffmpeg: null,
        queue: [],
      });
      guildAudioState = audioState.get(process.env.GUILD_ID);
    }

    const userInVc = interaction.member.voice.channel; // Guildmember in docs
    const botInVc = interaction.guild.members.me.voice.channel; // Guild in docs
    if (!userInVc) {
      return await interaction.reply({
        content: 'You need to be inside a voice channel to use this command',
        flags: MessageFlags.Ephemeral,
      });
    }

    // If the bot is in VC but the in a different channel than the user
    if (botInVc && userInVc.id !== botInVc.id) {
      return await interaction.reply({
        content:
          'You need to be in the same voice channel as the bot to use this command',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Make sure everything related to playing the music is active before the command is usable
    if (
      guildAudioState.connection &&
      guildAudioState.audioPlayer &&
      guildAudioState.subscription &&
      guildAudioState.currentSong
    ) {
      guildAudioState.audioPlayer.stop();
      const response = await interaction.reply({
        content: `Skipped song: ${guildAudioState.currentSong.title}`,
        withResponse: true,
      });
      response.resource.message.react('✅');
    } else {
      return await interaction.reply({
        content: 'There is no song currently playing',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
