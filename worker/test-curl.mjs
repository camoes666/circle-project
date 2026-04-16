import https from 'https';

const url = 'https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&lang=en';

const req = https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'https://www.youtube.com/',
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Length:', data.length);
    console.log('Preview:', data.slice(0, 300));
  });
});

req.on('error', e => console.error('Error:', e));
