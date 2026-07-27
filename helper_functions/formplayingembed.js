import { bold } from 'discord.js';
import { nameParser } from './nameparser.js';

const iconUrl = 'https://i.imgur.com/va5cEjo.jpeg';

export function formPlayingEmbed(title, img, audioState) {
  const songInfo = nameParser(
    audioState.currentSong.title,
    audioState.currentSong.channel,
  );

  const playingEmbed = {
    color: 0x32a852,
    title: bold(title),
    thumbnail: {
      url: img,
    },
    fields: [
      {
        name: '\u200b',
        value: `${bold(songInfo.song)} by ${bold(songInfo.creator)} (Duration ${bold(audioState.currentSong.duration)})`,
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
