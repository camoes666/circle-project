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
        catch(e) { resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const videoId = 'dQw4w9WgXcQ';

// Try different Android API format
const result = await post(
  'youtubei.googleapis.com',
  '/youtubei/v1/player?key=AIzaSyA8eiZmM1lafkgFrNQK6gHRKJBPiuTALAs&prettyPrint=false',
  {
    videoId,
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '19.09.37',
        androidSdkVersion: 30,
        hl: 'en',
        gl: 'US',
        utcOffsetMinutes: -240,
      },
    },
  },
  {
    'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
    'X-YouTube-Client-Name': '3',
    'X-YouTube-Client-Version': '19.09.37',
    'Accept': '*/*',
  }
);

console.log('Status:', result.status);
if (typeof result.body === 'string') {
  console.log('Response:', result.body.slice(0, 200));
} else {
  const status = result.body?.playabilityStatus?.status;
  console.log('Playability:', status);
  const tracks = result.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  console.log('Tracks:', tracks?.length, tracks?.map(t => t.languageCode));
}
