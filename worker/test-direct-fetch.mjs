import { Innertube } from 'youtubei.js';

const yt = await Innertube.create();
const info = await yt.getInfo('u0i154mWIGg');
const tracks = info.captions?.caption_tracks;

if (!tracks || tracks.length === 0) {
  console.log('No tracks found');
  process.exit(1);
}

console.log('Tracks:', tracks.map(t => ({ lang: t.language_code, kind: t.kind, url: t.base_url?.slice(0, 80) })));

const track = tracks.find(t => t.language_code === 'ko') || tracks.find(t => t.language_code === 'en') || tracks[0];
console.log('Selected track:', track.language_code, track.kind);

// Try to fetch base_url directly
const res = await fetch(track.base_url);
console.log('Fetch status:', res.status);
const xml = await res.text();
console.log('XML preview:', xml.slice(0, 300));
