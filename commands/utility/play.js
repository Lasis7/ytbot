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
    const textChannel = interaction.channel;
    const { audioState } = interaction.client;
    let guildAudioState = audioState.get(process.env.GUILD_ID);
    if (!guildAudioState) {
      audioState.set(process.env.GUILD_ID, {
        connection: null,
        audioPlayer: null,
        subscription: null,
        currentSong: null,
        queue: [],
      });
    }
    guildAudioState = audioState.get(process.env.GUILD_ID);
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
      // Get video's id
      const id = await parseId(videoUrl);

      // URL is normalized just in case
      const url = await normalizeUrl(id);

      const videoInfo = await video_basic_info(url);
      console.log('info', videoInfo);

      // Initial reply
      await interaction.reply({
        content: `Fetching ${videoInfo.video_details.title}`,
        flags: MessageFlags.Ephemeral,
      });

      if (!guildAudioState.connection) {
        // Connect to the same voice channel as the user
        guildAudioState.connection = joinVoiceChannel({
          channelId: userInVc.id,
          guildId: process.env.GUILD_ID,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });
      }

      if (!guildAudioState.audioPlayer) {
        guildAudioState.audioPlayer = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
          },
        });
      }

      guildAudioState.audioPlayer.on('error', (error) => {
        console.error(error);
      });

      guildAudioState.audioPlayer.on(AudioPlayerStatus.Idle, () => {
        textChannel.send('Queue is empty');
      });

      if (!guildAudioState.subscription) {
        guildAudioState.subscription = guildAudioState.connection.subscribe(
          guildAudioState.audioPlayer,
        );
      }

      guildAudioState.connection.on(
        VoiceConnectionStatus.Disconnected,
        async (oldState, newState) => {
          console.log('disconnected');
          try {
            // Promise.race is a promise that is either resolved or rejected based on if either promise inside it is resolved or rejected
            await Promise.race([
              // entersState allows the connection to be in a specific state for the given time before throwing an error
              entersState(
                guildAudioState.connection,
                VoiceConnectionStatus.Signalling,
                5000,
              ),
              entersState(
                guildAudioState.connection,
                VoiceConnectionStatus.Connecting,
                5000,
              ),
            ]);
          } catch {
            // Stops the player, destroyes the connection and cleanes the stale data, if the bot is truly disconnected, and not for example moving to another channel
            textChannel.send('Disconnected');
            guildAudioState.audioPlayer?.stop();
            guildAudioState.subscription?.unsubscribe();
            guildAudioState.connection?.destroy();
            guildAudioState.connection = null;
            guildAudioState.audioPlayer = null;
            guildAudioState.subscription = null;
            guildAudioState.currentSong = null;
            guildAudioState.queue = [];
          }
        },
      );

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
      guildAudioState.audioPlayer.play(resource);
      textChannel.send('Playing the song');
    } else {
      await interaction.reply({
        content: 'Please provide a valid URL',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
