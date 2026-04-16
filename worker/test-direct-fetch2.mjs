import { Innertube } from 'youtubei.js';

const yt = await Innertube.create();
const info = await yt.getInfo('u0i154mWIGg');
const tracks = info.captions?.caption_tracks;

const track = tracks.find(t => t.language_code === 'ko') || tracks[0];
console.log('Base URL:', track.base_url);

const res = await fetch(track.base_url);
console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
const text = await res.text();
console.log('Length:', text.length);
console.log('Content:', text.slice(0, 500));
