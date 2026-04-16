import { Innertube } from 'youtubei.js';

const yt = await Innertube.create();
const info = await yt.getInfo('u0i154mWIGg');
const tracks = info.captions?.caption_tracks;

const track = tracks.find(t => t.language_code === 'ko') || tracks[0];
console.log('Full URL:', track.base_url);

// Try adding fmt=json3 or fmt=srv3
const url = track.base_url + '&fmt=json3';
console.log('\nTrying fmt=json3...');
const res = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  }
});
console.log('Status:', res.status);
const text = await res.text();
console.log('Length:', text.length);
console.log('Content:', text.slice(0, 300));
