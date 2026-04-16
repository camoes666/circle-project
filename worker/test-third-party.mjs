import https from 'https';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
  });
}

const videoId = 'dQw4w9WgXcQ';

// Test 1: yt.lemnoslife.com  
console.log('=== Test 1: yt.lemnoslife.com ===');
try {
  const r = await get(`https://yt.lemnoslife.com/videos?part=transcript&id=${videoId}`);
  console.log('Status:', r.status, '| Length:', r.body.length);
  if (r.body.length < 500) console.log(r.body);
  else {
    const json = JSON.parse(r.body);
    console.log('Keys:', Object.keys(json));
    const items = json.items?.[0];
    if (items) {
      console.log('Item keys:', Object.keys(items));
      const transcript = items.transcript;
      if (transcript) console.log('Transcript preview:', JSON.stringify(transcript).slice(0, 300));
    }
  }
} catch(e) { console.log('Error:', e.message); }

// Test 2: tactiq
console.log('\n=== Test 2: tactiq transcript tool ===');
try {
  const r = await get(`https://tactiq-apps-prod.tactiq.io/transcript?videoUrl=https://www.youtube.com/watch%3Fv%3D${videoId}&langCode=en`);
  console.log('Status:', r.status, '| Length:', r.body.length);
  if (r.body.length < 1000) console.log(r.body);
  else console.log('Preview:', r.body.slice(0, 300));
} catch(e) { console.log('Error:', e.message); }
