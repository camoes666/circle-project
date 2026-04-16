// Try using youtubei.js with PO token support
import { Innertube, UniversalCache } from 'youtubei.js';

// The newer approach: generate a visitor data and PO token
const yt = await Innertube.create({
  cache: new UniversalCache(false), // no disk cache
  generate_session_locally: true,
});

console.log('Session:', {
  visitor_data: yt.session.context.client.visitorData?.slice(0, 20),
  has_po_token: !!yt.session.po_token,
});

const info = await yt.getInfo('dQw4w9WgXcQ');
const tracks = info.captions?.caption_tracks;
const enTrack = tracks?.find(t => t.language_code === 'en') || tracks?.[0];

if (!enTrack) { console.log('No tracks'); process.exit(1); }

// Use yt's own http client which should include proper headers
const url = enTrack.base_url;
console.log('\nTrying yt.session.http.fetch...');
try {
  const res = await yt.session.http.fetch(url);
  const text = await res.text();
  console.log('Length:', text.length);
  console.log('Preview:', text.slice(0, 300));
} catch(e) {
  console.log('Error:', e.message);
}
