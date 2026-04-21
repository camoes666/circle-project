# Intent Review — 2026-04-16

## 요약
- 스캔: 6개 파일 (`services/`, `App.jsx`), 약 20개 함수
- 후보: 5건 (high 1 / medium 3 / low 1)
- 최대 이슈: `App.jsx`에 트랜스크립트 에러 판별 로직이 인라인으로 숨어 있음

---

## 🔴 High Priority

### 1. `handleConvert()` 내 에러 판별 조건 — ⭐⭐ — `App.jsx:57-64`

**실제 책임**: "이 에러가 자막 fetch 실패인가?"를 판단하는 도메인 규칙

**문제**: 에러 메시지 문자열을 4개 패턴으로 `.includes()` 검사하는 로직이 이벤트 핸들러 한복판에 인라인으로 묻혀 있다. `transcript.js`가 던지는 에러 종류와 App이 감지하는 패턴이 **두 파일로 분산**되어 있어, 에러 메시지 하나가 바뀌면 App이 모르게 오동작한다.

```js
// 현재 — App.jsx:57
if (
  e.message.includes('자막') ||
  e.message.includes('fetch') ||
  e.message.includes('API') ||
  e.message.includes('Failed')
) {
  setShowManualInput(true)
}
```

**추출 제안**:

```js
// transcript.js 에 추가 (에러를 던지는 쪽이 판별도 담당)
export function isTranscriptFetchError(message) {
  return (
    message.includes('자막') ||
    message.includes('fetch') ||
    message.includes('API') ||
    message.includes('Failed')
  )
}

// App.jsx
import { extractVideoId, fetchTranscript, isTranscriptFetchError } from './services/transcript'
// ...
if (isTranscriptFetchError(e.message)) {
  setShowManualInput(true)
}
```

**추가 개선**: `transcript.js`에서 에러를 던질 때 커스텀 에러 클래스나 `error.type` 태그를 붙이면 문자열 비교 자체가 없어진다.

```js
// transcript.js
class TranscriptError extends Error {
  constructor(message) { super(message); this.name = 'TranscriptError' }
}
// throw new TranscriptError('이 영상에는 자막이 없습니다.')

// App.jsx — 훨씬 명확
if (e instanceof TranscriptError) {
  setShowManualInput(true)
}
```

---

## 🟡 Medium Priority

| 파일:라인 | 함수명 | 별점 | 실제 책임 | 추출 가치 |
|---|---|---|---|---|
| `App.jsx:24` | `handleConvert` | ⭐⭐⭐ | 수동/자동 두 경로로 분기하는 dispatcher | medium |
| `ai.js:17` | `callGroqOnce` | ⭐⭐⭐ | 단일 Groq chat completion 호출 | medium |
| `ai.js:25` | `callGroq` | ⭐⭐⭐ | 청킹 분기 포함한 Groq 전체 흐름 | medium |

### 2. `handleConvert` — 두 경로 혼재

수동 입력 경로(L29-41)와 URL 자동 fetch 경로(L43-67)가 한 함수에 섞여 있다. 현재 53줄이라 임박한 위험은 아니지만, 추가 요구사항이 붙으면 금방 80줄을 넘는다.

```js
// 제안: 경로별 분리
async function convertWithManualTranscript(transcript, format, settings) { ... }
async function convertFromUrl(url, format, settings) { ... }

const handleConvert = async () => {
  setError(''); setResult('')
  if (showManualInput && manualTranscript.trim()) {
    return runConvert(() => convertWithManualTranscript(...))
  }
  const videoId = extractVideoId(url)
  if (!videoId) { setError('유효한 YouTube URL을 입력해주세요.'); return }
  return runConvert(() => convertFromUrl(...))
}
```

### 3. `callGroqOnce` — "Once"가 전달하는 의도가 모호

`callGroq`와 구분하기 위한 내부 이름이지만, 단독으로 읽으면 "왜 한 번만 호출하는가?"가 불명확하다.

```js
// 현재
async function callGroqOnce(groq, content) { ... }

// 제안
async function requestGroqCompletion(groq, content) { ... }
```

### 4. `callGroq` — 청킹 분기가 안에 숨어 있음

함수명은 "Groq 호출"이지만 실제로는 "청킹 전략 선택 + 요약 취합"까지 한다.

```js
// 현재 — 두 관심사가 섞임
async function callGroq(transcript, prompt, apiKey) {
  const groq = new Groq(...)
  if (transcript.length <= CHUNK_SIZE) { ... }      // 경로 A
  const chunks = splitIntoChunks(...)               // 경로 B 시작
  for (const chunk of chunks) { ... }              // 청킹 요약
  return callGroqOnce(groq, prompt + summaries)     // 최종 합치기
}

// 제안: 청킹 경로 분리
async function summarizeChunks(groq, chunks) {
  const summaries = []
  for (const chunk of chunks) {
    summaries.push(await requestGroqCompletion(groq, `다음 자막의 일부를 핵심 내용 위주로 간략히 정리해줘:\n\n${chunk}`))
  }
  return summaries
}
```

---

## 🟢 Low Priority

| 파일:라인 | 함수명 | 별점 | 실제 책임 | 추출 가치 |
|---|---|---|---|---|
| `transcript.js:38-43` | *(인라인)* | — | 한국어→영어→asr→첫번째 트랙 선택 | low |

트랙 선택 우선순위 로직이 `getCaptionUrl` 안에 인라인으로 있다. 현재는 짧아서 문제없지만, "자동생성 자막 제외" 같은 요구가 붙으면 복잡해진다.

```js
// 추출 시 이름이 규칙을 못박음
function selectPreferredCaptionTrack(tracks) {
  return (
    tracks.find(t => t.languageCode === 'ko') ||
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.kind === 'asr') ||
    tracks[0]
  )
}
```

---

## 패턴 분석

### 분산된 의도
- **`'이 영상에는 자막이 없습니다.'`** 에러 메시지 — `transcript.js:35` (getCaptionUrl)와 `transcript.js:68` (fetchFromSupadata)에 동일 문자열이 각각 하드코딩되어 있다. 상수로 통일 권장.
  ```js
  const NO_CAPTION_ERROR = '이 영상에는 자막이 없습니다.'
  ```

### 잘 된 것
- `extractVideoId`, `parseXml`, `splitIntoChunks`, `fetchFromLocalServer` — 이름과 구현이 정직하게 일치하는 ⭐⭐⭐⭐⭐ 함수들. 이 패턴을 유지하면 된다.
- `buildPrompt` — 순수 함수, 단일 책임, 이름 명확.

### 전체 평가
서비스 레이어(`services/`)는 전반적으로 깔끔하다. 개선 여지가 있는 곳은 `App.jsx`의 `handleConvert` — UI 핸들러에 비즈니스 판단 로직이 섞이는 패턴이 시작되고 있다.

---

## 아키텍처 제안

1. **에러 분류 체계 도입** (`TranscriptError` 등) — 에러 타입으로 분기하면 문자열 패턴 매칭 없이도 명확하다.
2. **`handleConvert` 슬림화** — UI 핸들러는 "어떤 경로로 갈지 결정"만 하고, 실제 변환 로직은 바깥 함수에 위임한다.
