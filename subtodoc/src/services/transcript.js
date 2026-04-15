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

// 브라우저에서 YouTube InnerTube API를 직접 호출해 자막 URL 획득
// (브라우저 = 일반 사용자 IP → 봇 차단 없음)
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

  // 한국어 → 영어 → 자동생성 → 첫 번째 순으로 선택
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

export async function fetchTranscript(videoId) {
  // 1. 브라우저에서 자막 URL 획득 (사용자 IP 사용 → 봇 차단 없음)
  const captionUrl = await getCaptionUrl(videoId)

  // 2. Worker를 CORS 프록시로 사용해 자막 XML 다운로드
  const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(captionUrl)}`)
  if (!res.ok) throw new Error(`자막을 가져오지 못했습니다. (${res.status})`)

  return parseXml(await res.text())
}
