import https from 'https';

function post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const videoId = 'dQw4w9WgXcQ';

// Try ANDROID client - often bypasses bot detection
const androidResult = await post(
  'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
  {
    videoId,
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '18.11.34',
        androidSdkVersion: 30,
        hl: 'ko',
      },
    },
  },
  {
    'User-Agent': 'com.google.android.youtube/18.11.34 (Linux; U; Android 11) gzip',
    'X-YouTube-Client-Name': '3',
    'X-YouTube-Client-Version': '18.11.34',
  }
);

console.log('Status:', androidResult.status);
const status = androidResult.body?.playabilityStatus?.status;
const reason = androidResult.body?.playabilityStatus?.reason;
console.log('Playability:', status, reason || '');

const tracks = androidResult.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
console.log('Caption tracks:', tracks?.map(t => ({ lang: t.languageCode, url: t.baseUrl?.slice(0, 60) })));

if (tracks?.[0]) {
  console.log('\nTrying to fetch first caption URL...');
  const captionRes = await new Promise((resolve, reject) => {
    const req = https.get(tracks[0].baseUrl, {
      headers: {
        'User-Agent': 'com.google.android.youtube/18.11.34 (Linux; U; Android 11) gzip',
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
  });
  console.log('Caption fetch status:', captionRes.status, '| Length:', captionRes.body.length);
  if (captionRes.body.length > 0) console.log('Preview:', captionRes.body.slice(0, 300));
}
