const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

export function extractVideoId(url) {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// ── 브라우저에서 YouTube InnerTube API 직접 호출 (자동 모드)
async function getCaptionUrl(videoId) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoId,
      context: {
        client: { clientName: 'WEB', clientVersion: '2.20231219.04.00', hl: 'ko' },
      },
    }),
  })

  if (!res.ok) throw new Error(`YouTube API 오류: ${res.status}`)

  const data = await res.json()
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks

  if (!tracks || tracks.length === 0) {
    throw new Error('이 영상에는 자막이 없습니다.')
  }

  const track =
    tracks.find(t => t.languageCode === 'ko') ||
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.kind === 'asr') ||
    tracks[0]

  return track.baseUrl
}

function parseXml(xml) {
  return xml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Supadata API (무료 10회/일, supadata.ai)
export async function fetchFromSupadata(videoId, apiKey) {
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
    { headers: { 'x-api-key': apiKey } }
  )

  if (res.status === 401) throw new Error('Supadata API 키가 올바르지 않습니다.')
  if (res.status === 404 || res.status === 422)
    throw new Error('이 영상에는 자막이 없습니다.')
  if (!res.ok) throw new Error(`Supadata API 오류: ${res.status}`)

  const data = await res.json()
  // content가 문자열인 경우 (text=true 파라미터)
  if (typeof data.content === 'string') return data.content.trim()
  // content가 배열인 경우
  if (Array.isArray(data.content))
    return data.content.map(c => (typeof c === 'string' ? c : c.text)).join(' ').trim()

  throw new Error('Supadata API 응답 형식 오류')
}

// ── 로컬 Python 서버 (나중에 직접 구축)
// 서버 예시: GET /transcript?videoId=xxx → {"transcript": "..."}
export async function fetchFromLocalServer(videoId, serverUrl) {
  const base = serverUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/transcript?videoId=${videoId}`)

  if (!res.ok) throw new Error(`로컬 서버 오류: ${res.status}`)

  const data = await res.json()
  const text = data.transcript ?? data.text ?? data.content
  if (typeof text === 'string') return text.trim()
  throw new Error('로컬 서버 응답 형식 오류')
}

// ── 통합 진입점
export async function fetchTranscript(videoId, settings = {}) {
  const {
    transcriptProvider = 'auto',
    supadadataApiKey = '',
    localServerUrl = 'http://localhost:8000',
  } = settings

  if (transcriptProvider === 'supadata') {
    if (!supadadataApiKey) throw new Error('Supadata API 키를 설정에서 입력해주세요.')
    return fetchFromSupadata(videoId, supadadataApiKey)
  }

  if (transcriptProvider === 'local') {
    return fetchFromLocalServer(videoId, localServerUrl)
  }

  // auto: 브라우저 직접 호출 → Worker CORS 프록시
  const captionUrl = await getCaptionUrl(videoId)
  const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(captionUrl)}`)
  if (!res.ok) throw new Error(`자막을 가져오지 못했습니다. (${res.status})`)
  return parseXml(await res.text())
}
