import { Innertube } from 'youtubei.js';

const yt = await Innertube.create();

// Test with a well-known video that definitely has subtitles
const videoId = 'dQw4w9WgXcQ'; // Rick Astley - classic, has auto-captions
const info = await yt.getInfo(videoId);
const tracks = info.captions?.caption_tracks;

if (!tracks || tracks.length === 0) {
  console.log('No tracks for this video either');
  process.exit(1);
}

console.log('Tracks:', tracks.map(t => ({ lang: t.language_code, kind: t.kind })));
const track = tracks.find(t => t.language_code === 'en') || tracks[0];
console.log('Selected:', track.language_code, track.kind);
console.log('URL:', track.base_url);

const res = await fetch(track.base_url);
console.log('Status:', res.status);
const text = await res.text();
console.log('Length:', text.length);
if (text.length > 0) {
  console.log('Preview:', text.slice(0, 300));
}
