export default {
  async fetch(request) {
    const url = new URL(request.url)

    // CORS preflight 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      })
    }

    const videoId = url.searchParams.get('v')
    if (!videoId) {
      return new Response('Missing video ID', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // YouTube 페이지에서 captionTracks 추출
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    })
    const html = await pageRes.text()

    const match = html.match(/"captionTracks":(\[.*?\])/)
    if (!match) {
      return new Response('No captions found', {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const captionTracks = JSON.parse(match[1])
    const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0]

    if (!track) {
      return new Response('No caption track available', {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 자막 XML 가져오기
    const transcriptRes = await fetch(track.baseUrl)
    const xml = await transcriptRes.text()

    // XML에서 텍스트 추출
    const text = xml
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  },
}
