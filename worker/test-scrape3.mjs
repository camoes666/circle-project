import https from 'https';

function httpsRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        headers: res.headers, 
        body: Buffer.concat(chunks).toString('utf-8') 
      }));
    });
    req.on('error', reject);
  });
}

const videoId = 'dQw4w9WgXcQ';
const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

// Fetch page
const pageRes = await httpsRequest(`https://www.youtube.com/watch?v=${videoId}`, baseHeaders);
const cookies = pageRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';

const playerMatch = pageRes.body.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
const playerResponse = JSON.parse(playerMatch[1]);
const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
const enTrack = tracks?.find(t => t.languageCode === 'en') || tracks?.[0];
console.log('FULL URL:', enTrack.baseUrl);

// Try multiple variants
const variants = [
  enTrack.baseUrl,
  enTrack.baseUrl + '&fmt=xml',
  enTrack.baseUrl + '&fmt=json3',
  enTrack.baseUrl + '&fmt=srv3',
];

for (const url of variants) {
  const r = await httpsRequest(url, {
    ...baseHeaders,
    'Cookie': cookies,
    'Referer': `https://www.youtube.com/watch?v=${videoId}`,
  });
  console.log(`\nURL variant (${url.includes('fmt') ? url.split('fmt=')[1].split('&')[0] : 'plain'}):`);
  console.log('Status:', r.status, '| Length:', r.body.length);
  if (r.body.length > 0) console.log('Preview:', r.body.slice(0, 200));
}
