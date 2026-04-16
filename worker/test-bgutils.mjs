import { BG } from 'bgutils-js';
import https from 'https';

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
  });
}

// Step 1: Get the YouTube page to obtain visitor data and challenge
const videoId = 'dQw4w9WgXcQ';
console.log('Step 1: Getting YouTube page...');
const pageRes = await httpsGet(`https://www.youtube.com/watch?v=${videoId}`, {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
});

const cookies = pageRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';

// Extract visitor data from the page
const visitorDataMatch = pageRes.body.match(/"visitorData":"([^"]+)"/);
const visitorData = visitorDataMatch?.[1] || '';
console.log('Visitor data:', visitorData?.slice(0, 30));

// Extract caption tracks
const playerMatch = pageRes.body.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
const playerResponse = JSON.parse(playerMatch[1]);
const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
console.log('Tracks:', tracks?.map(t => t.languageCode));

if (!tracks?.[0]) { console.log('No tracks found'); process.exit(1); }

// Step 2: Try to get PO token using bgutils-js
console.log('\nStep 2: Generating PO token...');
try {
  // We need the challenge from the YouTube page
  const challengeMatch = pageRes.body.match(/"challenge":"([^"]+)"/);
  console.log('Challenge found:', !!challengeMatch);
  
  // For bgutils-js we need to configure it properly
  console.log('BG keys:', Object.keys(BG));
} catch(e) {
  console.log('Error:', e.message);
}

// Step 3: Try fetching caption track directly with Innertube via youtubei.js
import { Innertube } from 'youtubei.js';
const yt = await Innertube.create();

// Get the actual URL from youtubei.js
const info = await yt.getInfo(videoId);
const ytTracks = info.captions?.caption_tracks;
const track = ytTracks?.find(t => t.language_code === 'en') || ytTracks?.[0];
console.log('\nTrack base_url snippet:', track?.base_url?.slice(0, 100));

// Try using youtubei.js internals to fetch
const ytInternals = yt.session;
console.log('Session keys:', Object.keys(ytInternals));
console.log('Has po_token:', !!ytInternals.po_token);
console.log('Context client keys:', Object.keys(ytInternals.context?.client || {}));
