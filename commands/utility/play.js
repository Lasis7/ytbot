import { SlashCommandBuilder, MessageFlags, bold } from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  createAudioPlayer,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import 'dotenv/config';
import { video_basic_info } from 'play-dl';
import yt from '../../helper_functions/yt.js';
import playNextSong from '../../helper_functions/playfunctions.js';

export default {
  cooldown: 2,
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

    // Check if the given URL was valid
    const videoUrl = yt.checkUrl(interaction.options.getString('url', true));

    if (videoUrl) {
      // Get video's id
      const id = yt.parseId(videoUrl);

      // URL is normalized just in case
      const url = yt.normalizeUrl(id);

      const videoInfo = await video_basic_info(url);
      guildAudioState.queue.push({
        title: videoInfo.video_details.title,
        channel: videoInfo.video_details.channel,
        duration: videoInfo.video_details.durationRaw,
        thumbnail: videoInfo.video_details.thumbnails.at(-1).url,
        url: url,
      });

      console.log(videoInfo.video_details.thumbnails);

      // Initial reply
      await interaction.reply(
        `Song ${bold(videoInfo.video_details.title)} by ${bold(videoInfo.video_details.channel)} (duration ${bold(videoInfo.video_details.durationRaw)}) added to queue`,
      );

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

      if (!guildAudioState.subscription) {
        guildAudioState.subscription = guildAudioState.connection.subscribe(
          guildAudioState.audioPlayer,
        );
      }

      // Initial state when the bot joins the voicechat
      if (!guildAudioState.currentSong && guildAudioState.queue.length > 0) {
        playNextSong(guildAudioState);
        textChannel.send(
          `Playing ${guildAudioState.currentSong.title} by ${guildAudioState.currentSong.channel} (duration ${guildAudioState.currentSong.duration})`,
        );
      }

      // Statehandler for identifying when the song ends
      if (!guildAudioState.stateHandlerInit) {
        guildAudioState.stateHandlerInit = true;

        guildAudioState.audioPlayer.on('stateChange', (oldState, newState) => {
          if (oldState.status === 'playing' && newState.status === 'idle') {
            // ytdlp and ffmpeg are terminated between each song to avoid information overleaking
            guildAudioState.ytdlp.kill('SIGTERM');
            guildAudioState.ffmpeg.kill('SIGTERM');
            console.log('ytdlp killed');
            console.log('ffmpeg killed');

            if (guildAudioState.queue.length < 1) {
              guildAudioState.currentSong = null;
              textChannel.send('Queue is empty');
            } else {
              // Only start the new song when the audioplayer enters idle mode
              setImmediate(() => {
                playNextSong(guildAudioState);
                textChannel.send(
                  `Playing ${guildAudioState.currentSong.title} by ${guildAudioState.currentSong.channel} (duration ${guildAudioState.currentSong.duration})`,
                );
              });
            }
          }
        });
      }

      // Handle bot disconnecting
      guildAudioState.connection.on(
        VoiceConnectionStatus.Disconnected,
        async (oldState, newState) => {
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
            // Stops the player, destroys the connection and cleans the stale data, if the bot is truly disconnected, and not for example moving to another channel
            textChannel.send('Disconnected');
            guildAudioState.audioPlayer?.stop();
            guildAudioState.subscription?.unsubscribe();
            guildAudioState.audioPlayer?.removeAllListeners();
            try {
              guildAudioState.ytdlp?.kill('SIGTERM');
              guildAudioState.ffmpeg?.kill('SIGTERM');
            } catch (e) {
              console.error('Process killing error', e);
            }
            guildAudioState.connection = null;
            guildAudioState.audioPlayer = null;
            guildAudioState.subscription = null;
            guildAudioState.currentSong = null;
            guildAudioState.stateHandlerInit = null;
            guildAudioState.queue = [];
            guildAudioState.ytdlp = null;
            guildAudioState.ffmpeg = null;

            guildAudioState.connection?.destroy();
          }
        },
      );
    } else {
      await interaction.reply({
        content: 'Please provide a valid URL',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
