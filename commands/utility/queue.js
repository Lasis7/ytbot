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

    const exampleEmbed = {
      color: 0x0099ff,
      title: 'Some title',
      url: 'https://discord.js.org',
      author: {
        name: 'Some name',
        icon_url: 'https://i.imgur.com/AfFp7pu.png',
        url: 'https://discord.js.org',
      },
      description: 'Some description here',
      thumbnail: {
        url: 'https://i.imgur.com/AfFp7pu.png',
      },
      fields:
        songs.length > 0
          ? songs
          : [{ name: '\u200b', value: 'Queue is empty' }],
      image: {
        url: 'https://i.imgur.com/AfFp7pu.png',
      },
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Some footer text here',
        icon_url: 'https://i.imgur.com/AfFp7pu.png',
      },
    };

    textChannel.send({ embeds: [exampleEmbed] });
  },
};
