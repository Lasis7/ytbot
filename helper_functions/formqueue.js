import { bold } from 'discord.js';

export function formQueue(audioState) {
  const songs = [];

  if (audioState.currentSong) {
    songs.push({
      name: 'Now playing',
      value: `[1. ${audioState.currentSong.title} (duration ${audioState.currentSong.duration})](${audioState.currentSong.url})`,
    });
  }

  if (audioState.queue.length > 20) {
    audioState.queue.slice(0, 20).forEach((song, i) =>
      songs.push({
        name: '\u200b',
        value: `[${i + 2}. ${song.title} (duration ${song.duration})](${song.url})`,
      }),
    );
    songs.push({
      name: '\u200b',
      value: bold(`And ${audioState.queue.length - 20} more...`),
    });
  } else {
    audioState.queue.forEach((song, i) =>
      songs.push({
        name: '\u200b',
        value: `[${i + 2}. ${song.title} (duration ${song.duration})](${song.url})`,
      }),
    );
  }

  return songs;
}
