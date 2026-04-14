import { SlashCommandBuilder, MessageFlags, bold } from 'discord.js';
import { formQueue } from '../../helper_functions/formqueue.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the queue'),
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

    const songs = formQueue(guildAudioState);

    // Change the url to whatever you want
    const iconUrl = 'https://i.imgur.com/va5cEjo.jpeg';

    const queueEmbed = {
      color: 0x0099ff,
      title: bold('Queue'),
      thumbnail: {
        url: guildAudioState.currentSong.thumbnail,
      },
      fields:
        songs.length > 0
          ? songs
          : [{ name: '\u200b', value: 'Queue is empty' }],
      timestamp: new Date().toISOString(),
      footer: {
        text: '\u200b',
        icon_url: iconUrl,
      },
    };

    return await interaction.reply({ embeds: [queueEmbed] });
  },
};
