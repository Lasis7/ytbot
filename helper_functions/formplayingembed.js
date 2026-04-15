import { bold } from 'discord.js';

const iconUrl = 'https://i.imgur.com/va5cEjo.jpeg';

export function formPlayingEmbed(title, img, audioState) {
  const playingEmbed = {
    color: 0x32a852,
    title: bold(title),
    thumbnail: {
      url: img,
    },
    fields: [
      {
        name: '\u200b',
        value: `${audioState.currentSong.title} by ${audioState.currentSong.channel} (duration ${audioState.currentSong.duration})`,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: '\u200b',
      icon_url: iconUrl,
    },
  };

  return playingEmbed;
}
