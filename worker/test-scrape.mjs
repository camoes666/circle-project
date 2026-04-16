import https from 'https';

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        ...headers,
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
  });
}

// Fetch the YouTube watch page
const videoId = 'dQw4w9WgXcQ';
console.log('Fetching YouTube page...');
const { status, body } = await httpsGet(`https://www.youtube.com/watch?v=${videoId}`);
console.log('Status:', status);
console.log('Body length:', body.length);

// Find ytInitialPlayerResponse
const match = body.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
if (!match) {
  console.log('ytInitialPlayerResponse not found');
  // Try to find any relevant data
  const captionIdx = body.indexOf('captionTracks');
  if (captionIdx > -1) {
    console.log('captionTracks found at:', captionIdx);
    console.log('Context:', body.slice(captionIdx - 20, captionIdx + 200));
  }
  process.exit(1);
}

const playerResponse = JSON.parse(match[1]);
const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
console.log('Tracks:', tracks?.map(t => ({ lang: t.languageCode, url: t.baseUrl?.slice(0, 80) })));
