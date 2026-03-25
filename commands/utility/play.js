import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
} from '@discordjs/voice';
import { spawn } from 'node:child_process';
import 'dotenv/config';
import { video_basic_info } from 'play-dl';

let connection = null;
let audioPlayer = null;

function checkUrl(url) {
  const regexp =
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu\.be))(\/(?:youtube\.com\/watch\?v=|embed\/|live\/|v\/)?)([\w\-]{11})((?:\?|\&)\S+)?$/;
  const matches = url.match(regexp);

  if (matches) {
    return url;
  }
  return false;
}

async function parseId(url) {
  const regexp =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const matches = url.match(regexp);

  return matches ? matches[1] : null;
}

async function normalizeUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Provide a URL to play')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('Provide a valid URL')
        .setRequired(true),
    ),
  async execute(interaction) {
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

    // Check if the given URL was valid
    const videoUrl = checkUrl(interaction.options.getString('url', true));

    if (videoUrl) {
      if (!connection) {
        // Connect to the same voice channel as the user
        connection = joinVoiceChannel({
          channelId: userInVc.id,
          guildId: process.env.GUILD_ID,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
      }

      if (!audioPlayer) {
        audioPlayer = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
          },
        });
      }

      audioPlayer.on('error', (error) => {
        console.error(error);
      });

      audioPlayer.on(AudioPlayerStatus.Idle, () => {
        interaction.reply('Queue is empty');
      });

      const subscription = connection.subscribe(audioPlayer);

      connection.on(
        VoiceConnectionStatus.Disconnected,
        async (oldState, newState) => {
          console.log('disconnected');
          try {
            // Promise.race is a promise that is either resolved or rejected based on if either promise inside it is resolved or rejected
            await Promise.race([
              // entersState allows the connection to be in a specific state for the given time before throwing an error
              entersState(connection, VoiceConnectionStatus.Signalling, 5000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
          } catch {
            // Stop the player, unsubscribe the connection and finally destory it, if the bot is truly disconnected, not if it is moving to another voice channel or such
            audioPlayer.stop();
            subscription.unsubscribe();
            connection.destroy();
          }
        },
      );

      const id = await parseId(videoUrl);

      const url = await normalizeUrl(id);
      console.log(url);

      interaction.reply('YO');

      // yt-dlp options
      const musicProcess = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]);
      musicProcess.stderr.on('data', (error) =>
        console.error(error.toString()),
      );

      // Spawn ffmpeg to decode the audio into raw PCM for Discord
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        'pipe:0', // input from yt-dlp stdout
        '-f',
        's16le', // PCM 16-bit little endian
        '-ar',
        '48000', // sample rate for Discord
        '-ac',
        '2', // stereo
        'pipe:1', // output to stdout
      ]);
      ffmpeg.stderr.on('data', (error) => console.error(error.toString()));

      musicProcess.stdout.pipe(ffmpeg.stdin);

      const resource = createAudioResource(ffmpeg.stdout, {
        inputType: StreamType.Raw,
      });
      audioPlayer.play(resource);
    } else {
      await interaction.reply({
        content: 'Please provide a valid URL',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
