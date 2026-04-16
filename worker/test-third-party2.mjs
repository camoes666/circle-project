import https from 'https';

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.get({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: { 'User-Agent': 'Mozilla/5.0', ...headers },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
  });
}

const videoId = 'dQw4w9WgXcQ';

// Test: transcript.for.earth (known free service)
console.log('=== transcript.for.earth ===');
try {
  const r = await get(`https://transcript.for.earth/api/transcript?videoId=${videoId}`);
  console.log('Status:', r.status, '| Length:', r.body.length);
  console.log(r.body.slice(0, 300));
} catch(e) { console.log('Error:', e.message); }

// Test: YouTube Transcript API (ytapi.com or similar) 
console.log('\n=== downsub.com API ===');
try {
  const r = await get(`https://downsub.com/api/subtitle?url=https://www.youtube.com/watch?v=${videoId}&lang=en`);
  console.log('Status:', r.status, '| Length:', r.body.length);
  console.log(r.body.slice(0, 300));
} catch(e) { console.log('Error:', e.message); }

// Test: yt-api.p.rapidapi.com approach
console.log('\n=== youtubetranscript.com ===');
try {
  const r = await get(`https://youtubetranscript.com/?server_vid2=${videoId}`);
  console.log('Status:', r.status, '| Length:', r.body.length);
  console.log(r.body.slice(0, 500));
} catch(e) { console.log('Error:', e.message); }
