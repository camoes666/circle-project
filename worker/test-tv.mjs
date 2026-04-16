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
        try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch(e) { resolve({ status: res.statusCode, raw: Buffer.concat(chunks).toString().slice(0, 300) }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const videoId = 'dQw4w9WgXcQ';

// Try TVHTML5 (Smart TV) client - used by yt-dlp, doesn't require PO token
const result = await post(
  {
    videoId,
    context: {
      client: {
        clientName: 'TVHTML5',
        clientVersion: '7.20240724.13.00',
        hl: 'en',
        gl: 'US',
      },
    },
  },
  {
    'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1',
    'X-YouTube-Client-Name': '7',
    'X-YouTube-Client-Version': '7.20240724.13.00',
    'Accept': '*/*',
  }
);

console.log('Status:', result.status);
if (result.raw) {
  console.log('Raw:', result.raw);
} else {
  const playability = result.body?.playabilityStatus?.status;
  console.log('Playability:', playability);
  const tracks = result.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  console.log('Tracks:', tracks?.map(t => t.languageCode));
  
  if (tracks?.length > 0) {
    const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
    console.log('\nFetching caption XML...');
    const captRes = await new Promise((resolve, reject) => {
      const req = https.get(track.baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0)' }
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject);
    });
    console.log('Caption status:', captRes.status, '| Length:', captRes.body.length);
    if (captRes.body.length > 0) console.log('Preview:', captRes.body.slice(0, 400));
  }
}
