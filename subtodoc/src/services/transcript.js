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

export async function fetchTranscript(videoId) {
  const res = await fetch(`${WORKER_URL}/transcript?v=${videoId}`)
  if (!res.ok) throw new Error(`자막을 가져오지 못했습니다. (${res.status})`)
  return res.text()
}
