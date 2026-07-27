export function nameParser(title, channel) {
  // Dash is sometimes used as a separator between artist and song title
  const hasDash = title.includes(' - ');
  if (hasDash) {
    const wordCount = title.split('-');
    // If there are more then two dashes (e.g. artist name has a dash), the title gets split into more than two parts. In that case, channel name is returned instead
    if (wordCount > 2) {
      return { song: title, creator: channel };
    }
    // Artist name should always be first
    const [artist, songTitle] = title.split(' - ');
    return { song: songTitle, creator: artist };
  }
  // If the artist and the title are separated in some other way, just return the channel name
  return { song: title, creator: channel };
}
