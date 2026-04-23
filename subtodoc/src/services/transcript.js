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
  if (!tracks || tracks.length === 0) throw new Error('이 영상에는 자막이 없습니다.')
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

function parseXmlWithTimestamps(xml) {
  const segments = []
  const regex = /<text[^>]*\sstart="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    const secs = Math.floor(parseFloat(match[1]))
    const mm = String(Math.floor(secs / 60)).padStart(2, '0')
    const ss = String(secs % 60).padStart(2, '0')
    const text = match[2]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/<[^>]*>/g, '').trim()
    if (text) segments.push(`[${mm}:${ss}] ${text}`)
  }
  return segments.length > 0 ? segments.join('\n') : parseXml(xml)
}

function secondsToTimestamp(offset) {
  const secs = Math.floor(offset)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return `[${mm}:${ss}]`
}

// ── Supadata API (무료 10회/일, supadata.ai)
export async function fetchFromSupadata(videoId, apiKey, withTimestamps = false) {
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
    { headers: { 'x-api-key': apiKey } }
  )
  if (res.status === 401) throw new Error('Supadata API 키가 올바르지 않습니다.')
  if (res.status === 404 || res.status === 422) throw new Error('이 영상에는 자막이 없습니다.')
  if (!res.ok) throw new Error(`Supadata API 오류: ${res.status}`)

  const data = await res.json()

  if (withTimestamps && Array.isArray(data.content)) {
    return data.content
      .map(c => {
        const text = typeof c === 'string' ? c : c.text
        const offset = c.offset ?? c.start ?? null
        return offset !== null ? `${secondsToTimestamp(offset)} ${text}` : text
      })
      .filter(Boolean)
      .join('\n')
  }

  if (typeof data.content === 'string') return data.content.trim()
  if (Array.isArray(data.content))
    return data.content.map(c => (typeof c === 'string' ? c : c.text)).join(' ').trim()

  throw new Error('Supadata API 응답 형식 오류')
}

// ── 로컬 Python 서버
export async function fetchFromLocalServer(videoId, serverUrl) {
  const base = serverUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/transcript?videoId=${videoId}`)
  if (!res.ok) throw new Error(`로컬 서버 오류: ${res.status}`)
  const data = await res.json()
  const text = data.transcript ?? data.text ?? data.content
  if (typeof text === 'string') return text.trim()
  throw new Error('로컬 서버 응답 형식 오류')
}

// ── 자체 자막 서버 (POST /api/transcript)
export async function fetchFromCustomServer(youtubeUrl, serverUrl = 'http://115.68.193.201') {
  const base = serverUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/api/transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: youtubeUrl }),
  })

  const json = await res.json().catch(() => ({}))

  if (res.status === 400) throw new Error('유효한 유튜브 주소가 아닙니다.')
  if (res.status === 404) throw new Error('자막이 비활성화되었거나 찾을 수 없습니다.')
  if (!res.ok) throw new Error(json.detail || `자막 서버 오류: ${res.status}`)
  if (json.status !== 'success' || !json.data) throw new Error('자막 서버 응답 형식 오류')

  return json.data.trim()
}

// ── 통합 진입점
export async function fetchTranscript(videoId, settings = {}) {
  const {
    transcriptProvider = 'custom-server',
    supadadataApiKey = '',
    localServerUrl = 'http://localhost:8000',
    customServerUrl = 'http://115.68.193.201',
    withTimestamps = false,
    url = '',
  } = settings

  if (transcriptProvider === 'custom-server') {
    const youtubeUrl = url || `https://www.youtube.com/watch?v=${videoId}`
    return fetchFromCustomServer(youtubeUrl, customServerUrl)
  }
  if (transcriptProvider === 'supadata') {
    if (!supadadataApiKey) throw new Error('Supadata API 키를 설정에서 입력해주세요.')
    return fetchFromSupadata(videoId, supadadataApiKey, withTimestamps)
  }
  if (transcriptProvider === 'local') {
    return fetchFromLocalServer(videoId, localServerUrl)
  }

  // auto: InnerTube + CORS Worker
  const captionUrl = await getCaptionUrl(videoId)
  const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(captionUrl)}`)
  if (!res.ok) throw new Error(`자막을 가져오지 못했습니다. (${res.status})`)
  const xml = await res.text()
  return withTimestamps ? parseXmlWithTimestamps(xml) : parseXml(xml)
}
