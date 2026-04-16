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
const clients = [
  // WEB_EMBEDDED_PLAYER - used when video is embedded on third-party sites
  { name: 'WEB_EMBEDDED_PLAYER', version: '2.20210721.00.00', num: '56', embedUrl: 'https://www.youtube.com/embed/'+videoId },
  // MWEB - mobile web
  { name: 'MWEB', version: '2.20240726.01.00', num: '2' },
];

for (const client of clients) {
  console.log(`\n=== ${client.name} ===`);
  const result = await post(
    {
      videoId,
      context: {
        client: {
          clientName: client.name,
          clientVersion: client.version,
          hl: 'en',
          gl: 'US',
          ...(client.embedUrl ? { 
            originalUrl: client.embedUrl,
            embedUrl: client.embedUrl,
          } : {})
        },
        thirdParty: client.embedUrl ? { embedUrl: client.embedUrl } : undefined,
      },
    },
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-YouTube-Client-Name': client.num,
      'X-YouTube-Client-Version': client.version,
      'Origin': 'https://www.youtube.com',
    }
  );
  
  if (result.raw) { console.log('Raw:', result.raw); continue; }
  const playability = result.body?.playabilityStatus?.status;
  console.log('Playability:', playability);
  const tracks = result.body?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  console.log('Tracks:', tracks?.length || 0, tracks?.map(t => t.languageCode));
}
