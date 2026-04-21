# SubToDoc v2 Implementation Plan

> **목표**: 영상 미리보기 · 타임스탬프 · 직접 지시하기 · 변환 히스토리 4개 기능 추가  
> **기반**: v1 완성 코드베이스 위에 추가. 기존 파일 수정 + 새 파일 생성.  
> **원칙**: 각 Task는 독립적으로 커밋 가능. 테스트 먼저 작성.

---

## 파일 변경 지도

```
subtodoc/src/
├── App.jsx                          ← 수정 (videoId 파생 상태, 새 state 3개, history 연결)
├── services/
│   ├── transcript.js                ← 수정 (withTimestamps 옵션 추가)
│   └── prompts.js                   ← 수정 (customInstruction, includeTimestamps 옵션)
├── components/
│   ├── VideoPreview.jsx             ← 신규
│   ├── HistoryPanel.jsx             ← 신규
│   ├── ResultViewer.jsx             ← 수정 (videoId prop, 타임스탬프 링크)
│   └── FormatSelector.jsx           ← 수정 (타임스탬프 토글 + 직접 지시하기 토글)
└── hooks/
    └── useHistory.js                ← 신규
```

---

## Task 1: videoId 파생 상태 — App.jsx 기반 정비

**왜 먼저 하는가**: 영상 임베드·타임스탬프 링크·히스토리 저장이 모두 `videoId`를 필요로 함.  
현재 `videoId`는 `handleConvert` 내부 지역 변수 → 파생 상태로 끌어올린다.

**변경 파일**: `subtodoc/src/App.jsx`

- [ ] **Step 1: `useMemo`로 videoId 파생**

```jsx
import { useState, useMemo } from 'react'
// ...

// url이 바뀔 때마다 자동 계산
const videoId = useMemo(() => extractVideoId(url), [url])
```

- [ ] **Step 2: handleConvert에서 지역 videoId 제거**

```jsx
// Before
const videoId = extractVideoId(url)
if (!videoId) { ... }

// After (videoId는 이미 파생 상태)
if (!videoId) { ... }
```

- [ ] **Step 3: 테스트 실행 — 기존 테스트 전부 통과 확인**

```bash
cd subtodoc && npm run test:run -- src/App.test.jsx
```

Expected: PASS (기존 테스트 전부)

- [ ] **Step 4: 커밋**

```bash
git add subtodoc/src/App.jsx
git commit -m "refactor: derive videoId as memoized state in App"
```

---

## Task 2: 영상 미리보기 임베드 — VideoPreview 컴포넌트

**파일**: `subtodoc/src/components/VideoPreview.jsx` (신규)

- [ ] **Step 1: 컴포넌트 작성**

```jsx
// VideoPreview.jsx
export default function VideoPreview({ videoId }) {
  if (!videoId) return null
  return (
    <div className="rounded-xl overflow-hidden bg-black aspect-video animate-fade-in">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube 영상 미리보기"
        loading="lazy"
      />
    </div>
  )
}
```

- [ ] **Step 2: App.jsx에 통합**

URL 탭 입력란 바로 아래에 삽입:

```jsx
{activeTab === 'url' && (
  <>
    <UrlInput value={url} onChange={setUrl} />
    <VideoPreview videoId={videoId} />
  </>
)}
```

- [ ] **Step 3: 수동 확인**

`npm run dev` → URL 입력 → iframe이 즉시 표시되는지 확인

- [ ] **Step 4: 커밋**

```bash
git add subtodoc/src/components/VideoPreview.jsx subtodoc/src/App.jsx
git commit -m "feat: add VideoPreview embed on URL input"
```

---

## Task 3: 타임스탬프 지원 — transcript.js 수정

**파일**: `subtodoc/src/services/transcript.js`

- [ ] **Step 1: parseXmlWithTimestamps 추가**

```js
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
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()
    if (text) segments.push(`[${mm}:${ss}] ${text}`)
  }
  return segments.join('\n') || parseXml(xml) // fallback
}
```

- [ ] **Step 2: fetchFromSupadata에 withTimestamps 옵션 추가**

```js
export async function fetchFromSupadata(videoId, apiKey, withTimestamps = false) {
  // ... 기존 fetch 로직 ...
  const data = await res.json()

  if (withTimestamps && Array.isArray(data.content)) {
    return data.content.map(c => {
      const text = typeof c === 'string' ? c : c.text
      const secs = Math.floor(c.offset ?? c.start ?? 0)
      const mm = String(Math.floor(secs / 60)).padStart(2, '0')
      const ss = String(secs % 60).padStart(2, '0')
      return `[${mm}:${ss}] ${text}`
    }).join('\n')
  }

  // 기존 로직 유지
  if (typeof data.content === 'string') return data.content.trim()
  if (Array.isArray(data.content))
    return data.content.map(c => (typeof c === 'string' ? c : c.text)).join(' ').trim()
  throw new Error('Supadata API 응답 형식 오류')
}
```

- [ ] **Step 3: fetchTranscript에 withTimestamps 전달**

```js
export async function fetchTranscript(videoId, settings = {}) {
  const { transcriptProvider, supadadataApiKey, localServerUrl, withTimestamps = false } = settings

  if (transcriptProvider === 'supadata') {
    return fetchFromSupadata(videoId, supadadataApiKey, withTimestamps)
  }
  if (transcriptProvider === 'local') {
    return fetchFromLocalServer(videoId, localServerUrl) // 로컬 서버는 서버 측에서 처리
  }

  // auto 모드: XML 파싱
  const captionUrl = await getCaptionUrl(videoId)
  const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(captionUrl)}`)
  if (!res.ok) throw new Error(`자막을 가져오지 못했습니다. (${res.status})`)
  const xml = await res.text()
  return withTimestamps ? parseXmlWithTimestamps(xml) : parseXml(xml)
}
```

- [ ] **Step 4: 기존 테스트 통과 확인**

```bash
npm run test:run -- src/services/transcript.test.js
```

- [ ] **Step 5: 커밋**

```bash
git add subtodoc/src/services/transcript.js
git commit -m "feat: add withTimestamps option to transcript service"
```

---

## Task 4: 타임스탬프 + 직접 지시하기 — prompts.js 수정

**파일**: `subtodoc/src/services/prompts.js`

- [ ] **Step 1: buildPrompt에 options 파라미터 추가**

```js
// Before
export function buildPrompt(formatId, language = '한국어') {
  const format = FORMATS.find(f => f.id === formatId)
  return `다음 YouTube 영상 자막을 ${language}로 변환해줘.\n${format.instruction}\n\n자막:\n`
}

// After
export function buildPrompt(formatId, language = '한국어', options = {}) {
  const { includeTimestamps = false, customInstruction = '' } = options
  const format = FORMATS.find(f => f.id === formatId)

  let prompt = `다음 YouTube 영상 자막을 ${language}로 변환해줘.\n${format.instruction}\n`

  if (includeTimestamps) {
    prompt += `중요한 내용마다 가까운 타임스탬프를 [MM:SS] 형식으로 포함해줘. 예: [01:23] 핵심 내용\n`
  }

  if (customInstruction.trim()) {
    prompt += `추가 지시사항: ${customInstruction.trim()}\n`
  }

  return prompt + '\n자막:\n'
}
```

- [ ] **Step 2: 테스트 수정 및 추가**

기존 테스트는 options 없이 호출하므로 그대로 통과. 새 케이스 추가:

```js
test('includeTimestamps 옵션이 타임스탬프 지시를 포함한다', () => {
  const prompt = buildPrompt('summary', '한국어', { includeTimestamps: true })
  expect(prompt).toContain('[MM:SS]')
})

test('customInstruction이 프롬프트에 포함된다', () => {
  const prompt = buildPrompt('blog', '한국어', { customInstruction: '유머러스하게' })
  expect(prompt).toContain('유머러스하게')
})
```

- [ ] **Step 3: 테스트 통과 확인**

```bash
npm run test:run -- src/services/prompts.test.js
```

- [ ] **Step 4: App.jsx에서 options 전달**

```jsx
// handleConvert 내부
const prompt = buildPrompt(format, settings.language, {
  includeTimestamps,
  customInstruction,
})
const transcript = await fetchTranscript(videoId, { ...settings, withTimestamps: includeTimestamps })
```

- [ ] **Step 5: 커밋**

```bash
git add subtodoc/src/services/prompts.js subtodoc/src/services/prompts.test.js
git commit -m "feat: add includeTimestamps and customInstruction to buildPrompt"
```

---

## Task 5: 타임스탬프 링크 렌더링 — ResultViewer 수정

**파일**: `subtodoc/src/components/ResultViewer.jsx`

- [ ] **Step 1: videoId prop 추가 + 타임스탬프 링크 변환**

`inlineMarkdown` 함수에 videoId 파라미터 추가:

```js
function inlineMarkdown(text, videoId) {
  let result = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-100 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-400 italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="text-blue-300 bg-gray-800 px-1 rounded text-xs">$1</code>')

  if (videoId) {
    result = result.replace(/\[(\d{1,2}):(\d{2})\]/g, (_, mm, ss) => {
      const t = parseInt(mm) * 60 + parseInt(ss)
      return `<a href="https://www.youtube.com/watch?v=${videoId}&t=${t}"
        target="_blank" rel="noopener noreferrer"
        class="inline-flex items-center gap-0.5 text-blue-400 hover:text-blue-300 font-mono text-xs
               px-1.5 py-0.5 bg-blue-950/50 rounded border border-blue-800/40
               hover:border-blue-600/60 transition-colors">[${mm}:${ss}]</a>`
    })
  }
  return result
}
```

`parseMarkdown`에 videoId 전달:

```js
function parseMarkdown(text, videoId) {
  // ... 각 dangerouslySetInnerHTML에서 inlineMarkdown(line, videoId) 호출
}

export default function ResultViewer({ content, videoId }) {
  // ...
  return (
    // ...
    <div className="space-y-0.5">
      {parseMarkdown(content, videoId)}
    </div>
  )
}
```

- [ ] **Step 2: App.jsx에서 videoId 전달**

```jsx
<ResultViewer content={result} videoId={videoId} />
```

- [ ] **Step 3: 수동 확인**

타임스탬프가 있는 결과에서 `[01:23]` 형태가 클릭 가능한 파란 링크로 표시되는지 확인

- [ ] **Step 4: 커밋**

```bash
git add subtodoc/src/components/ResultViewer.jsx subtodoc/src/App.jsx
git commit -m "feat: make [MM:SS] timestamps clickable YouTube links in ResultViewer"
```

---

## Task 6: 직접 지시하기 UI — FormatSelector 수정

**파일**: `subtodoc/src/components/FormatSelector.jsx`

직접 지시하기 토글과 타임스탬프 토글을 FormatSelector 하단에 추가한다.

- [ ] **Step 1: props 추가**

```jsx
export default function FormatSelector({
  selected, onChange,
  includeTimestamps, onTimestampsChange,
  customInstruction, onCustomInstructionChange,
}) {
```

- [ ] **Step 2: 타임스탬프 토글 추가**

형식 카드 그리드 아래:

```jsx
{/* 타임스탬프 토글 */}
<label className="flex items-center gap-3 cursor-pointer group">
  <div
    onClick={() => onTimestampsChange(!includeTimestamps)}
    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
      includeTimestamps ? 'bg-blue-600' : 'bg-gray-700'
    }`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
      includeTimestamps ? 'translate-x-4' : 'translate-x-0'
    }`} />
  </div>
  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
    타임스탬프 포함 <span className="text-xs text-gray-600">[MM:SS] 클릭 시 영상 해당 구간으로</span>
  </span>
</label>
```

- [ ] **Step 3: 직접 지시하기 토글 + 입력란 추가**

```jsx
{/* 직접 지시하기 */}
<div className="space-y-2">
  <button
    type="button"
    onClick={() => onCustomInstructionChange(customInstruction ? '' : ' ')}
    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
  >
    <svg ...chevron icon... className={`transition-transform ${customInstruction !== undefined && customInstruction !== '' ? 'rotate-180' : ''}`} />
    직접 지시하기
  </button>
  {customInstruction !== '' && (
    <input
      type="text"
      value={customInstruction}
      onChange={e => onCustomInstructionChange(e.target.value)}
      placeholder="예: 초보자 친화적으로 설명해줘 · 유머러스하게 · 스타트업 투자자용으로"
      className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
    />
  )}
</div>
```

- [ ] **Step 4: App.jsx에서 state + props 연결**

```jsx
const [includeTimestamps, setIncludeTimestamps] = useState(false)
const [customInstruction, setCustomInstruction] = useState('')

// ...

<FormatSelector
  selected={format}
  onChange={setFormat}
  includeTimestamps={includeTimestamps}
  onTimestampsChange={setIncludeTimestamps}
  customInstruction={customInstruction}
  onCustomInstructionChange={setCustomInstruction}
/>
```

- [ ] **Step 5: 커밋**

```bash
git add subtodoc/src/components/FormatSelector.jsx subtodoc/src/App.jsx
git commit -m "feat: add timestamp toggle and custom instruction to FormatSelector"
```

---

## Task 7: 변환 히스토리 — useHistory + HistoryPanel

### 7-a. useHistory 훅

**파일**: `subtodoc/src/hooks/useHistory.js` (신규)

```js
import { useState } from 'react'

const HISTORY_KEY = 'subtodoc_history'
const MAX_ITEMS = 20

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  })

  const addEntry = (entry) => {
    const next = [
      { ...entry, id: Date.now(), createdAt: new Date().toISOString() },
      ...history,
    ].slice(0, MAX_ITEMS)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  const removeEntry = (id) => {
    const next = history.filter(e => e.id !== id)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  return { history, addEntry, removeEntry, clearHistory }
}
```

저장 항목 스키마:
```ts
{
  id: number           // Date.now()
  createdAt: string    // ISO 8601
  url: string
  videoId: string | null
  format: string       // 'summary' | 'blog' | 'minutes' | 'notes'
  result: string
  customInstruction: string
  includeTimestamps: boolean
}
```

### 7-b. HistoryPanel 컴포넌트

**파일**: `subtodoc/src/components/HistoryPanel.jsx` (신규)

```jsx
import { useState } from 'react'
import { FORMATS } from '../services/prompts'

export default function HistoryPanel({ history, onRestore, onRemove, onClear }) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) return null

  return (
    <div className="border border-gray-800 rounded-2xl overflow-hidden">
      {/* 헤더 토글 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-900/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          {/* clock icon */}
          지난 변환 {history.length}개
        </span>
        {/* chevron icon, rotates when open */}
      </button>

      {open && (
        <div className="divide-y divide-gray-800/60">
          {history.map(entry => {
            const fmt = FORMATS.find(f => f.id === entry.format)
            const date = new Date(entry.createdAt).toLocaleDateString('ko-KR', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })
            const urlPreview = entry.url
              ? entry.url.replace('https://www.youtube.com/watch?v=', 'youtu.be/')
              : '자막 직접 입력'

            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900/40 transition-colors group">
                {/* 영상 썸네일 (videoId 있을 때) */}
                {entry.videoId && (
                  <img
                    src={`https://img.youtube.com/vi/${entry.videoId}/default.jpg`}
                    alt=""
                    className="w-14 h-10 object-cover rounded-lg flex-shrink-0 bg-gray-800"
                  />
                )}

                <button
                  onClick={() => onRestore(entry)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-xs text-gray-400 truncate">{urlPreview}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {fmt?.label} · {date}
                    {entry.includeTimestamps && ' · 타임스탬프'}
                    {entry.customInstruction && ` · "${entry.customInstruction.slice(0, 20)}"`}
                  </p>
                </button>

                <button
                  onClick={() => onRemove(entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all p-1"
                  aria-label="삭제"
                >
                  {/* X icon */}
                </button>
              </div>
            )
          })}

          {history.length > 3 && (
            <button
              onClick={onClear}
              className="w-full px-4 py-2 text-xs text-gray-700 hover:text-red-400 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

### 7-c. App.jsx 연결

- [ ] **Step 1**: `useHistory` 임포트 + 호출
- [ ] **Step 2**: 변환 성공 후 `addEntry` 호출

```jsx
addEntry({
  url: activeTab === 'url' ? url : '',
  videoId: videoId ?? null,
  format,
  result: doc,
  customInstruction,
  includeTimestamps,
})
```

- [ ] **Step 3**: `onRestore` 핸들러 구현

```jsx
const handleRestore = (entry) => {
  if (entry.url) { setActiveTab('url'); setUrl(entry.url) }
  setFormat(entry.format)
  setResult(entry.result)
  setCustomInstruction(entry.customInstruction || '')
  setIncludeTimestamps(entry.includeTimestamps || false)
}
```

- [ ] **Step 4**: 결과 영역 아래에 `<HistoryPanel>` 배치

- [ ] **Step 5: 커밋**

```bash
git add subtodoc/src/hooks/useHistory.js subtodoc/src/components/HistoryPanel.jsx subtodoc/src/App.jsx
git commit -m "feat: add conversion history with restore and delete"
```

---

## Task 8: 전체 통합 검증 + 배포

- [ ] **Step 1: 전체 테스트**

```bash
cd subtodoc && npm run test:run
```

Expected: 기존 테스트 전부 PASS (새 기능은 수동 확인)

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

- [ ] **Step 3: 수동 시나리오 체크**

| 시나리오 | 확인 |
|---|---|
| URL 입력 → 임베드 플레이어 즉시 표시 | ☐ |
| 타임스탬프 토글 ON → 결과에 [MM:SS] 링크 표시, 클릭 시 YouTube 이동 | ☐ |
| 직접 지시하기 → 입력 후 변환 → 지시 반영 확인 | ☐ |
| 변환 성공 → "지난 변환" 패널에 항목 추가 | ☐ |
| 히스토리 항목 클릭 → URL, 형식, 결과 복원 | ☐ |
| 모바일 세로 화면에서 레이아웃 정상 | ☐ |

- [ ] **Step 4: GitHub Pages 배포**

```bash
npm run build
# worktree 방식으로 gh-pages 브랜치 배포
```

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: SubToDoc v2 — 영상 임베드, 타임스탬프, 직접 지시하기, 히스토리"
```

---

## 의존 관계 요약

```
Task 1 (videoId 파생)
  └── Task 2 (VideoPreview) — videoId 필요
  └── Task 5 (타임스탬프 링크) — videoId 필요
  └── Task 7c (히스토리 저장) — videoId 저장

Task 3 (transcript withTimestamps)
  └── Task 4 (prompts options)
    └── Task 6 (FormatSelector UI)
      └── Task 7 (App 통합)

Task 5 (ResultViewer) — Task 3·4 완료 후 의미 있음

Tasks 1–7 완료 → Task 8 (통합 검증 + 배포)
```

Tasks 1→3→4→6, 1→2, 1→5, 3→5는 순서 의존성 있음.  
Tasks 2·3·7-a는 서로 독립적으로 병렬 작업 가능.
