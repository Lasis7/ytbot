import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  createAudioPlayer,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import 'dotenv/config';

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
    await interaction.reply({
      content: 'working',
      flags: MessageFlags.Ephemeral,
    });

    // Connect to the same voice channel as the user
    const connection = joinVoiceChannel({
      channelId: userInVc.id,
      guildId: process.env.GUILD_ID,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
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
  },
};
