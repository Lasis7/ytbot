import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the queue'),
  async execute(interaction) {
    const textChannel = interaction.channel; // Text channel the command was sent from
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

    const songs = [];

    if (guildAudioState.currentSong) {
      songs.push({
        name: 'Now playing',
        value: `1. ${guildAudioState.currentSong.title} (duration ${guildAudioState.currentSong.duration})`,
      });
    }

    guildAudioState.queue.forEach((song, i) =>
      songs.push({
        name: '\u200b',
        value: `${i + 2}. ${song.title} (duration ${song.duration})`,
      }),
    );

    // Change the url to whatever you want
    const thumbnailUrl = 'https://i.imgur.com/va5cEjo.jpeg';

    const exampleEmbed = {
      color: 0x0099ff,
      title: 'Some title',
      thumbnail: {
        url: thumbnailUrl,
      },
      fields:
        songs.length > 0
          ? songs
          : [{ name: '\u200b', value: 'Queue is empty' }],
      timestamp: new Date().toISOString(),
      footer: {
        text: '\u200b',
        icon_url: thumbnailUrl,
      },
    };

    return await interaction.reply({ embeds: [exampleEmbed] });

    // textChannel.send({ embeds: [exampleEmbed] });
  },
};
