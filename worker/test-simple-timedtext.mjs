import https from 'https';

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers,
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
  });
}

const videoId = 'dQw4w9WgXcQ';

// Simple old-style URLs
const urls = [
  `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
  `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=xml`,
  `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
  `https://www.youtube.com/api/timedtext?v=${videoId}&lang=ko`,
  // List all available captions
  `https://www.youtube.com/api/timedtext?v=${videoId}&type=list`,
];

for (const url of urls) {
  const r = await get(url);
  console.log(`\n${url.split('?')[1]}`);
  console.log(`Status: ${r.status} | Length: ${r.body.length}`);
  if (r.body.length > 0 && r.body.length < 1000) console.log('Body:', r.body);
  else if (r.body.length > 0) console.log('Preview:', r.body.slice(0, 200));
}
