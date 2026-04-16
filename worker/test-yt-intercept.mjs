import { Innertube } from 'youtubei.js';

// Intercept the HTTP calls youtubei.js makes
const yt = await Innertube.create();

// Patch the http.fetch to log what's being sent
const originalFetch = yt.session.http.fetch.bind(yt.session.http);
let capturedRequest = null;

yt.session.http.fetch = async function(url, init) {
  if (url.includes('/player') || url.includes('player')) {
    capturedRequest = { url, body: init?.body, headers: init?.headers };
    console.log('Intercepted request to:', url);
    console.log('Request headers:', JSON.stringify(init?.headers, null, 2));
    const bodyObj = JSON.parse(init?.body || '{}');
    console.log('Request body (context.client):', JSON.stringify(bodyObj?.context?.client, null, 2));
  }
  return originalFetch(url, init);
};

const info = await yt.getInfo('dQw4w9WgXcQ');
console.log('\nPlayability:', info.basic_info?.is_playable);
const tracks = info.captions?.caption_tracks;
console.log('Tracks:', tracks?.map(t => t.language_code));
