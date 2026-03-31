import { spawn } from 'node:child_process';
import { createAudioResource, StreamType } from '@discordjs/voice';

function playNextSong(audioState) {
  if (audioState.queue.length < 1) return;

  // Get the next song from the queue and remove it
  const currentSong = audioState.queue.shift();
  audioState.currentSong = currentSong;

  const ytdlp = spawn('yt-dlp', [
    '-f',
    'bestaudio',
    '-o',
    '-',
    currentSong.url,
  ]); //spawn ytdlp
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

  // Ytdlp and ffmpeg are saved to audioState-collection
  audioState.ytdlp = ytdlp;
  audioState.ffmpeg = ffmpeg;

  ytdlp.stderr.on('data', (data) => console.log(`[yt-dlp] ${data.toString()}`));

  ytdlp.on('error', (error) => {
    console.error(`[yt-dlp error] ${error.toString()}`);
  });
  ffmpeg.stderr.on('data', (data) =>
    console.log(`[ffmpeg] ${data.toString()}`),
  );

  ffmpeg.on('error', (error) => {
    console.error(`[ffmpeg error] ${error.toString()}`);
  });

  ytdlp.stdout.pipe(ffmpeg.stdin);

  const resource = createAudioResource(ffmpeg.stdout, {
    inputType: StreamType.Raw,
  });

  audioState.audioPlayer.play(resource);
}

export default playNextSong;
