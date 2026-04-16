import https from 'https';

function post(body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'www.youtube.com',
      path: '/youtubei/v1/player',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, raw: raw.slice(0, 200) }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const videoId = 'dQw4w9WgXcQ';

// Try the exact same format as transcript.js
const result = await post(
  {
    videoId,
    context: {
      client: { clientName: 'WEB', clientVersion: '2.20231219.04.00', hl: 'ko' },
    },
  },
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
    'X-YouTube-Client-Name': '1',
    'X-YouTube-Client-Version': '2.20231219.04.00',
  }
);

console.log('Status:', result.status);
if (result.raw) {
  console.log('Raw:', result.raw);
} else {
  const playability = result.body?.playabilityStatus?.status;
  const reason = result.body?.playabilityStatus?.reason;
  console.log('Playability:', playability, reason || '');
  const tracks = result.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  console.log('Tracks:', tracks?.length, tracks?.map(t => t.languageCode));
  
  if (tracks?.[0]) {
    const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
    console.log('\nCaption URL:', track.baseUrl.slice(0, 100));
    
    // Now try fetching the caption URL
    const captRes = await new Promise((resolve, reject) => {
      const req = https.get(track.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject);
    });
    console.log('\nCaption fetch: status =', captRes.status, 'length =', captRes.body.length);
    if (captRes.body.length > 0) console.log('Preview:', captRes.body.slice(0, 300));
  }
}
