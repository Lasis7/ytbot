import { bold } from 'discord.js';
import { nameParser } from './nameparser.js';

export function formQueue(audioState) {
  const songs = [];

  if (audioState.currentSong) {
    const songInfo = nameParser(
      audioState.currentSong.title,
      audioState.currentSong.channel,
    );
    songs.push({
      name: 'Now playing',
      value: `1. [${songInfo.song} by ${songInfo.creator}](${audioState.currentSong.url}) (Duration ${audioState.currentSong.duration})`,
    });
  }

  if (audioState.queue.length > 20) {
    audioState.queue.slice(0, 20).forEach((song, i) => {
      const songInfo = nameParser(song.title, song.channel);
      songs.push({
        name: '\u200b',
        value: `${i + 2}. [${songInfo.song} by ${songInfo.creator}](${song.url}) (Duration ${song.duration})`,
      });
    });
    songs.push({
      name: '\u200b',
      value: bold(`And ${audioState.queue.length - 20} more...`),
    });
  } else {
    audioState.queue.forEach((song, i) => {
      const songInfo = nameParser(song.title, song.channel);
      songs.push({
        name: '\u200b',
        value: `${i + 2}. [${songInfo.song} by ${songInfo.creator}](${song.url}) (Duration ${song.duration})`,
      });
    });
  }

  return songs;
}
