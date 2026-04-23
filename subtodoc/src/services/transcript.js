/**
 * ════════════════════════════════════════════════════════════
 *  transcript.js  —  유튜브 자막을 가져오는 파일
 * ════════════════════════════════════════════════════════════
 *
 * 이 파일은 YouTube 영상에서 자막(말하는 내용의 글자)을
 * 가져오는 모든 방법을 담고 있어요.
 *
 * 자막을 가져오는 4가지 방법:
 *
 * 1. 자체 서버 (custom-server) ← 기본값
 *    → 개발자가 직접 만든 서버(https://my-yt-api.duckdns.org)에
 *      유튜브 URL을 보내면 자막을 받아줘요.
 *      가장 안정적이고 빠른 방법이에요.
 *
 * 2. Supadata API
 *    → supadata.ai 라는 서비스의 API를 써요.
 *      무료로 하루 10번까지 사용할 수 있어요.
 *      API 키를 발급받아서 설정에 입력해야 해요.
 *
 * 3. 로컬 서버 (local)
 *    → 내 컴퓨터에서 직접 Python 서버를 실행할 때 써요.
 *      개발자를 위한 방법이에요.
 *
 * 4. 자동 (auto)
 *    → YouTube의 내부 API를 직접 호출해서 자막 URL을 가져와요.
 *      CORS 문제 때문에 중간에 Worker(중계 서버)를 거쳐야 해요.
 *
 * CORS란?
 * → 브라우저의 보안 규칙이에요.
 *   예를 들어 GitHub Pages(A 사이트)에서 duckdns.org(B 사이트)에
 *   데이터를 요청하면 브라우저가 막아버려요.
 *   B 사이트에서 "A 사이트가 접근해도 돼" 라고 허락(CORS 설정)해야
 *   통신이 가능해요.
 */

// WORKER_URL: CORS 문제를 해결해주는 중계 서버 주소예요
// 환경변수(VITE_WORKER_URL)가 있으면 그걸 쓰고, 없으면 localhost를 써요
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

/**
 * extractVideoId — YouTube URL에서 영상 ID를 뽑아주는 함수
 *
 * YouTube 영상 ID는 URL에 포함된 짧은 문자열이에요.
 * 예: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *     여기서 "dQw4w9WgXcQ" 부분이 영상 ID예요.
 *
 * 다양한 URL 형태를 모두 처리할 수 있어요:
 * - https://www.youtube.com/watch?v=ABC123 → ABC123
 * - https://youtu.be/ABC123 → ABC123 (단축 URL)
 * - https://www.youtube.com/embed/ABC123 → ABC123 (삽입형 URL)
 *
 * @param {string} url - YouTube URL 문자열
 * @returns {string|null} - 영상 ID 또는 찾지 못하면 null
 */
export function extractVideoId(url) {
  // 각각의 URL 형태에 맞는 패턴(정규식)들이에요
  // 정규식이란 특정 문자 패턴을 찾는 검색 도구예요
  const patterns = [
    /[?&]v=([^&]+)/,           // ?v=ID 또는 &v=ID 형태
    /youtu\.be\/([^?]+)/,      // youtu.be/ID 형태 (단축 URL)
    /youtube\.com\/embed\/([^?]+)/, // embed/ID 형태 (삽입형)
  ]

  // 각 패턴을 차례로 시도해봐요
  for (const pattern of patterns) {
    const match = url.match(pattern)
    // 패턴에 맞는 부분을 찾으면 ID 부분만 돌려줘요
    if (match) return match[1]
  }

  // 아무 패턴도 맞지 않으면 null(없음)을 돌려줘요
  return null
}

/**
 * getCaptionUrl — YouTube 내부 API를 통해 자막 파일 URL을 가져오는 함수
 *
 * YouTube는 영상 정보를 가져올 수 있는 내부 API가 있어요.
 * 여기에 영상 ID를 보내면 자막 URL 목록을 받을 수 있어요.
 *
 * 자막 언어 우선순위:
 * 1. 한국어 자막이 있으면 그걸 써요
 * 2. 없으면 영어 자막을 써요
 * 3. 없으면 자동 생성 자막(asr)을 써요
 * 4. 그것도 없으면 아무 자막이나 첫 번째 걸 써요
 *
 * @param {string} videoId - YouTube 영상 ID
 * @returns {Promise<string>} - 자막 XML 파일을 다운로드할 수 있는 URL
 * @throws {Error} - API 오류 또는 자막이 없을 때 에러를 던져요
 */
async function getCaptionUrl(videoId) {
  // YouTube 내부 API에 영상 정보를 요청해요
  const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoId,
      context: {
        // WEB 클라이언트인 척 요청해요 (hl: 'ko' = 한국어 선호)
        client: { clientName: 'WEB', clientVersion: '2.20231219.04.00', hl: 'ko' },
      },
    }),
  })

  // 요청이 실패하면 에러를 던져요
  if (!res.ok) throw new Error(`YouTube API 오류: ${res.status}`)

  const data = await res.json()

  // 응답에서 자막 트랙 목록을 꺼내요
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks

  // 자막이 전혀 없으면 에러를 던져요
  if (!tracks || tracks.length === 0) throw new Error('이 영상에는 자막이 없습니다.')

  // 자막 언어 우선순위: 한국어 → 영어 → 자동생성 → 첫 번째 것
  const track =
    tracks.find(t => t.languageCode === 'ko') ||
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.kind === 'asr') ||
    tracks[0]

  // 선택된 자막 트랙의 다운로드 URL을 돌려줘요
  return track.baseUrl
}

/**
 * parseXml — 자막 XML 데이터에서 순수 텍스트만 추출하는 함수
 *
 * YouTube 자막은 XML 형식으로 제공돼요.
 * XML이란? 태그(<text start="0">안녕하세요</text>)로 감싸진 데이터 형식이에요.
 *
 * 이 함수는 태그를 모두 제거하고 순수한 글자만 남겨줘요.
 * HTML 특수문자(&amp; → &, &lt; → < 등)도 원래대로 돌려줘요.
 *
 * @param {string} xml - YouTube XML 자막 데이터
 * @returns {string} - 깔끔하게 정리된 자막 텍스트
 */
function parseXml(xml) {
  return xml
    .replace(/<[^>]*>/g, ' ')   // <태그> 를 전부 공백으로 바꿔요
    .replace(/&amp;/g, '&')     // &amp; → & (특수문자 복원)
    .replace(/&lt;/g, '<')      // &lt; → <
    .replace(/&gt;/g, '>')      // &gt; → >
    .replace(/&#39;/g, "'")     // &#39; → ' (따옴표)
    .replace(/&quot;/g, '"')    // &quot; → " (큰따옴표)
    .replace(/\s+/g, ' ')       // 여러 개의 공백을 하나로 줄여요
    .trim()                     // 앞뒤 공백을 제거해요
}

/**
 * parseXmlWithTimestamps — 자막 XML에서 시간 표시(타임스탬프)와 함께 텍스트를 추출하는 함수
 *
 * 일반 parseXml과 달리 "[01:23] 자막 내용" 형태로 시간 정보도 포함해요.
 * 사용자가 "타임스탬프 포함" 옵션을 켰을 때 사용해요.
 *
 * 예시 결과:
 * [00:05] 안녕하세요
 * [00:08] 오늘은 요리를 해볼게요
 * [00:12] 먼저 재료를 준비합니다
 *
 * @param {string} xml - YouTube XML 자막 데이터
 * @returns {string} - 타임스탬프가 포함된 자막 텍스트 (없으면 일반 parseXml 결과)
 */
function parseXmlWithTimestamps(xml) {
  const segments = [] // 각 자막 조각을 담을 배열

  // XML에서 start 속성(시작 시간)과 텍스트를 찾는 패턴이에요
  // 예: <text start="5.12">안녕하세요</text>
  const regex = /<text[^>]*\sstart="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g
  let match

  // 패턴에 맞는 모든 자막을 하나씩 꺼내요
  while ((match = regex.exec(xml)) !== null) {
    // 시작 시간(초)을 정수로 변환해요 (예: 5.12초 → 5초)
    const secs = Math.floor(parseFloat(match[1]))

    // 초를 분:초 형태로 변환해요 (예: 65초 → 01:05)
    const mm = String(Math.floor(secs / 60)).padStart(2, '0') // 분 (2자리)
    const ss = String(secs % 60).padStart(2, '0')             // 초 (2자리)

    // 자막 텍스트에서 HTML 특수문자와 태그를 제거해요
    const text = match[2]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/<[^>]*>/g, '') // 내부 태그 제거
      .trim()

    // 텍스트가 있을 때만 "[MM:SS] 텍스트" 형태로 배열에 추가해요
    if (text) segments.push(`[${mm}:${ss}] ${text}`)
  }

  // 타임스탬프 자막이 있으면 줄바꿈으로 연결해서 돌려줘요
  // 없으면 일반 파싱 결과를 돌려줘요
  return segments.length > 0 ? segments.join('\n') : parseXml(xml)
}

/**
 * secondsToTimestamp — 초(숫자)를 [MM:SS] 형태 문자열로 바꿔주는 함수
 *
 * 예: 65 → "[01:05]"
 *     3600 → "[60:00]"
 *
 * @param {number} offset - 시작 시간(초)
 * @returns {string} - "[MM:SS]" 형태의 문자열
 */
function secondsToTimestamp(offset) {
  const secs = Math.floor(offset)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return `[${mm}:${ss}]`
}

/**
 * fetchFromSupadata — Supadata API를 통해 자막을 가져오는 함수
 *
 * Supadata(supadata.ai)는 YouTube 자막을 제공하는 외부 서비스예요.
 * 무료 플랜은 하루 10번까지 사용 가능해요.
 * API 키를 설정 화면에서 입력해야 해요.
 *
 * @param {string}  videoId        - YouTube 영상 ID
 * @param {string}  apiKey         - Supadata API 키 (설정에서 입력)
 * @param {boolean} withTimestamps - true면 타임스탬프 포함해서 가져와요
 * @returns {Promise<string>} - 자막 텍스트
 * @throws {Error} - API 오류, 인증 실패, 자막 없음 등의 경우 에러를 던져요
 */
export async function fetchFromSupadata(videoId, apiKey, withTimestamps = false) {
  // Supadata API에 영상 ID로 자막을 요청해요
  // 헤더의 x-api-key에 API 키를 넣어서 인증해요
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
    { headers: { 'x-api-key': apiKey } }
  )

  // 각종 에러 상황을 처리해요
  if (res.status === 401) throw new Error('Supadata API 키가 올바르지 않습니다.')
  if (res.status === 404 || res.status === 422) throw new Error('이 영상에는 자막이 없습니다.')
  if (!res.ok) throw new Error(`Supadata API 오류: ${res.status}`)

  const data = await res.json()

  // 타임스탬프 포함 옵션이 켜져 있고, 자막이 배열 형태로 오면
  if (withTimestamps && Array.isArray(data.content)) {
    return data.content
      .map(c => {
        // c가 문자열이면 그대로, 객체이면 text 속성을 꺼내요
        const text = typeof c === 'string' ? c : c.text
        // 시작 시간(offset 또는 start 속성)을 꺼내요
        const offset = c.offset ?? c.start ?? null
        // 시간이 있으면 "[MM:SS] 텍스트", 없으면 텍스트만
        return offset !== null ? `${secondsToTimestamp(offset)} ${text}` : text
      })
      .filter(Boolean) // 빈 값 제거
      .join('\n')       // 줄바꿈으로 연결
  }

  // 타임스탬프 없이 순수 텍스트만 가져올 때
  if (typeof data.content === 'string') return data.content.trim()
  if (Array.isArray(data.content))
    return data.content.map(c => (typeof c === 'string' ? c : c.text)).join(' ').trim()

  throw new Error('Supadata API 응답 형식 오류')
}

/**
 * fetchFromLocalServer — 로컬 Python 서버에서 자막을 가져오는 함수
 *
 * 개발자가 자신의 컴퓨터에서 Python 서버를 직접 실행했을 때 사용해요.
 * 서버는 GET /transcript?videoId=XXX 요청을 처리할 수 있어야 해요.
 *
 * @param {string} videoId   - YouTube 영상 ID
 * @param {string} serverUrl - 로컬 서버 주소 (예: http://localhost:8000)
 * @returns {Promise<string>} - 자막 텍스트
 * @throws {Error} - 서버 오류 또는 응답 형식 오류
 */
export async function fetchFromLocalServer(videoId, serverUrl) {
  // URL 끝에 슬래시(/)가 있으면 제거해요 (중복 방지)
  const base = serverUrl.replace(/\/$/, '')

  // 서버에 GET 요청으로 자막을 요청해요
  const res = await fetch(`${base}/transcript?videoId=${videoId}`)
  if (!res.ok) throw new Error(`로컬 서버 오류: ${res.status}`)

  const data = await res.json()

  // 응답에서 자막 텍스트를 꺼내요 (서버마다 다른 필드명을 쓸 수 있어요)
  const text = data.transcript ?? data.text ?? data.content
  if (typeof text === 'string') return text.trim()

  throw new Error('로컬 서버 응답 형식 오류')
}

/**
 * fetchFromCustomServer — 자체 자막 서버에서 자막을 가져오는 함수
 *
 * 개발자가 직접 만든 서버(https://my-yt-api.duckdns.org)를 이용해요.
 * POST /api/transcript 로 YouTube URL을 보내면 자막을 받아줘요.
 *
 * 요청 형식:
 * POST https://my-yt-api.duckdns.org/api/transcript
 * Body: { "url": "https://www.youtube.com/watch?v=XXX" }
 *
 * 응답 형식:
 * { "status": "success", "data": "자막 텍스트..." }
 *
 * ⚠️ CORS 주의:
 * 브라우저 보안 정책 때문에 GitHub Pages(HTTPS)에서 HTTP 서버로는 요청이 차단돼요.
 * 이 함수는 그런 상황을 감지해서 사용자에게 명확한 안내 메시지를 보여줘요.
 *
 * @param {string} youtubeUrl - 전체 YouTube URL
 * @param {string} serverUrl  - 자체 서버 주소 (기본값: https://my-yt-api.duckdns.org)
 * @returns {Promise<string>} - 자막 텍스트
 * @throws {Error} - 연결 실패, 잘못된 URL, 자막 없음 등의 경우
 */
export async function fetchFromCustomServer(youtubeUrl, serverUrl = 'https://my-yt-api.duckdns.org') {
  // URL 끝 슬래시 제거
  const base = serverUrl.replace(/\/$/, '')

  let res
  try {
    // 서버에 POST 요청으로 YouTube URL을 보내요
    res = await fetch(`${base}/api/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl }),
    })
  } catch {
    // fetch 자체가 실패하면 네트워크 문제이거나 CORS 문제예요

    // HTTP 서버인데 HTTPS 페이지에서 요청한 경우를 감지해요
    // → 브라우저가 "Mixed Content"(혼합 콘텐츠)로 차단해요
    const isHttpServer = base.startsWith('http://')
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:'
    if (isHttpServer && isHttpsPage) {
      throw new Error(
        '자체 서버(HTTP)가 브라우저에서 차단됐습니다. ' +
        '서버에 HTTPS를 적용하거나, 로컬에서 실행 시 http://localhost 로 접속해주세요.'
      )
    }

    // HTTPS 서버인데 연결 실패면 CORS 설정 문제일 가능성이 높아요
    throw new Error(
      '자막 서버에 연결할 수 없습니다. ' +
      'CORS 설정이 필요할 수 있습니다 — 서버에 allow_origins=["*"] 를 추가해주세요.'
    )
  }

  // 응답을 JSON으로 파싱해요 (실패하면 빈 객체 {})
  const json = await res.json().catch(() => ({}))

  // 각종 HTTP 에러 상황을 처리해요
  if (res.status === 400) throw new Error('유효한 유튜브 주소가 아닙니다.')
  if (res.status === 404) throw new Error('자막이 비활성화되었거나 찾을 수 없습니다.')
  if (!res.ok) throw new Error(json.detail || `자막 서버 오류: ${res.status}`)

  // 서버 응답 형식 검증
  if (json.status !== 'success' || !json.data) throw new Error('자막 서버 응답 형식 오류')

  // 앞뒤 공백 제거 후 자막 텍스트를 돌려줘요
  return json.data.trim()
}

/**
 * fetchTranscript — 자막을 가져오는 통합 진입점 함수
 *
 * 이 함수가 앱 전체에서 자막을 가져올 때 사용하는 메인 함수예요.
 * settings(설정)에 따라 어떤 방법으로 자막을 가져올지 결정해요.
 *
 * 처리 흐름:
 * 사용자가 선택한 자막 소스에 따라
 * → custom-server: fetchFromCustomServer 호출
 * → supadata: fetchFromSupadata 호출
 * → local: fetchFromLocalServer 호출
 * → auto: YouTube 내부 API + CORS Worker 사용
 *
 * @param {string} videoId      - YouTube 영상 ID
 * @param {object} settings     - 앱 설정 객체
 * @param {string} settings.transcriptProvider  - 자막 소스 선택 ('custom-server'|'supadata'|'local'|'auto')
 * @param {string} settings.supadadataApiKey    - Supadata API 키
 * @param {string} settings.localServerUrl      - 로컬 서버 주소
 * @param {string} settings.customServerUrl     - 자체 서버 주소
 * @param {boolean} settings.withTimestamps     - 타임스탬프 포함 여부
 * @param {string} settings.url                 - 원본 YouTube URL (자체 서버에서 사용)
 * @returns {Promise<string>} - 자막 텍스트
 */
export async function fetchTranscript(videoId, settings = {}) {
  // settings에서 필요한 값들을 꺼내요 (없으면 기본값 사용)
  const {
    transcriptProvider = 'custom-server', // 기본은 자체 서버
    supadadataApiKey = '',
    localServerUrl = 'http://localhost:8000',
    customServerUrl = 'https://my-yt-api.duckdns.org',
    withTimestamps = false,
    url = '',          // 원본 YouTube URL
  } = settings

  // 자체 서버를 선택한 경우
  if (transcriptProvider === 'custom-server') {
    // url이 있으면 그걸 쓰고, 없으면 videoId로 URL을 만들어요
    const youtubeUrl = url || `https://www.youtube.com/watch?v=${videoId}`
    return fetchFromCustomServer(youtubeUrl, customServerUrl)
  }

  // Supadata API를 선택한 경우
  if (transcriptProvider === 'supadata') {
    if (!supadadataApiKey) throw new Error('Supadata API 키를 설정에서 입력해주세요.')
    return fetchFromSupadata(videoId, supadadataApiKey, withTimestamps)
  }

  // 로컬 Python 서버를 선택한 경우
  if (transcriptProvider === 'local') {
    return fetchFromLocalServer(videoId, localServerUrl)
  }

  // auto 모드: YouTube 내부 API로 자막 URL을 얻어 직접 다운로드해요
  // 1단계: YouTube 내부 API에서 자막 파일 URL을 가져와요
  const captionUrl = await getCaptionUrl(videoId)

  // 2단계: CORS Worker를 거쳐서 자막 XML을 다운로드해요
  //         (브라우저에서 YouTube에 직접 요청하면 CORS가 막기 때문)
  const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(captionUrl)}`)
  if (!res.ok) throw new Error(`자막을 가져오지 못했습니다. (${res.status})`)

  const xml = await res.text()

  // 타임스탬프 포함 여부에 따라 다른 파싱 함수를 써요
  return withTimestamps ? parseXmlWithTimestamps(xml) : parseXml(xml)
}
