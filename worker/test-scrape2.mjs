import https from 'https';

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
  });
}

const videoId = 'dQw4w9WgXcQ';
const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

// 1. Fetch the YouTube page to get cookies + caption URLs
console.log('Step 1: Fetching YouTube page...');
const pageRes = await httpsGet(`https://www.youtube.com/watch?v=${videoId}`, baseHeaders);

// Extract cookies
const cookies = pageRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
console.log('Cookies:', cookies.slice(0, 100));

// Extract caption URL from ytInitialPlayerResponse
const playerMatch = pageRes.body.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
const playerResponse = JSON.parse(playerMatch[1]);
const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
const enTrack = tracks?.find(t => t.languageCode === 'en') || tracks?.[0];
console.log('Track:', enTrack?.languageCode, enTrack?.baseUrl?.slice(0, 80));

// 2. Fetch timedtext with cookies
console.log('\nStep 2: Fetching timedtext with cookies...');
const captionRes = await httpsGet(enTrack.baseUrl, {
  ...baseHeaders,
  'Cookie': cookies,
  'Referer': `https://www.youtube.com/watch?v=${videoId}`,
});
console.log('Status:', captionRes.status);
console.log('Content-Length:', captionRes.headers['content-length']);
console.log('Body length:', captionRes.body.length);
console.log('Preview:', captionRes.body.slice(0, 400));
