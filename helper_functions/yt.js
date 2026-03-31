function checkUrl(url) {
  const regexp =
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu\.be))(\/(?:youtube\.com\/watch\?v=|embed\/|live\/|v\/)?)([\w\-]{11})((?:\?|\&)\S+)?$/;
  const matches = url.match(regexp);

  if (matches) {
    return url;
  }
  return false;
}

function parseId(url) {
  const regexp =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const matches = url.match(regexp);

  return matches ? matches[1] : null;
}

function normalizeUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export default { checkUrl, parseId, normalizeUrl };
