const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400, headers: CORS_HEADERS })
    }

    // 보안: YouTube 도메인만 허용
    const allowed = ['youtube.com', 'googlevideo.com', 'ytimg.com']
    const isAllowed = allowed.some(domain => targetUrl.includes(domain))
    if (!isAllowed) {
      return new Response('Only YouTube URLs allowed', { status: 403, headers: CORS_HEADERS })
    }

    try {
      const res = await fetch(targetUrl)
      const text = await res.text()
      return new Response(text, {
        status: res.ok ? 200 : res.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } catch (e) {
      return new Response(`Proxy error: ${e.message}`, { status: 502, headers: CORS_HEADERS })
    }
  },
}
