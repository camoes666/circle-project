import https from 'https';

function post(hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname,
      path,
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
        try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch(e) { resolve({ status: res.statusCode, raw: Buffer.concat(chunks).toString().slice(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const videoId = 'dQw4w9WgXcQ';

// Try iOS client - often works 
const result = await post(
  'www.youtube.com',
  '/youtubei/v1/player',
  {
    videoId,
    context: {
      client: {
        clientName: 'IOS',
        clientVersion: '19.16.3',
        deviceModel: 'iPhone16,2',
        hl: 'en',
        gl: 'US',
      },
    },
  },
  {
    'User-Agent': 'com.google.ios.youtube/19.16.3 (iPhone16,2; U; CPU iOS 17_4 like Mac OS X)',
    'X-YouTube-Client-Name': '5',
    'X-YouTube-Client-Version': '19.16.3',
    'Accept': '*/*',
  }
);

console.log('Status:', result.status);
if (result.raw) {
  console.log('Raw response:', result.raw);
} else {
  console.log('Playability:', result.body?.playabilityStatus?.status);
  const tracks = result.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  console.log('Tracks:', tracks?.map(t => ({ lang: t.languageCode, url: t.baseUrl?.slice(0, 80) })));
  
  if (tracks?.[0]?.baseUrl) {
    console.log('\nFetching caption...');
    const captionRes = await new Promise((resolve, reject) => {
      const req = https.get(tracks[0].baseUrl, {
        headers: { 'User-Agent': 'com.google.ios.youtube/19.16.3' }
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject);
    });
    console.log('Caption status:', captionRes.status, '| Length:', captionRes.body.length);
    if (captionRes.body.length > 0) console.log('Preview:', captionRes.body.slice(0, 300));
  }
}
