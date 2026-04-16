import { Innertube } from 'youtubei.js';

const yt = await Innertube.create();

// Look at what visitor data and context youtubei.js uses
const ctx = yt.session.context;
console.log('Context client:');
console.log(JSON.stringify(ctx.client, null, 2));
console.log('\nSession api_key:', yt.session.api_key?.slice(0, 20));
console.log('Session user_agent:', yt.session.user_agent?.slice(0, 80));
