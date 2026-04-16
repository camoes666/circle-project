import { Innertube } from 'youtubei.js';

const yt = await Innertube.create();
const info = await yt.getInfo('u0i154mWIGg');
const tracks = info.captions?.caption_tracks;

const track = tracks.find(t => t.language_code === 'ko') || tracks[0];

// Try with browser-like headers
const res = await fetch(track.base_url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'https://www.youtube.com/',
  }
});
console.log('Status:', res.status);
const text = await res.text();
console.log('Length:', text.length);
console.log('Content:', text.slice(0, 500));

// Also try with youtubei.js's own fetch
console.log('\n--- Using youtubei fetch ---');
const res2 = await yt.session.http.fetch(track.base_url);
const text2 = await res2.text();
console.log('Length:', text2.length);
console.log('Content:', text2.slice(0, 500));
